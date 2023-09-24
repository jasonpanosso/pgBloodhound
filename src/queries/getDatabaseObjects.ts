import type { Client } from 'pg';
import type { DatabaseObject } from '@/types/Database';
import { generatePgParameters } from '@/utils/queryUtils';

export default async function getDatabaseObjects(
  db: Client,
  schemas: string[]
) {
  const query = `
    SELECT 
        typname AS "objectName", 
        nspname AS schema,
        CASE typtype
            WHEN 'c' THEN CASE relkind
                WHEN 'r' THEN 'table'
                WHEN 'p' THEN 'table'
                WHEN 'v' THEN 'view'
                WHEN 'm' THEN 'materializedView'
                WHEN 'c' THEN 'compositeType'
                END
            WHEN 'd' THEN 'domain'
            WHEN 'e' THEN 'enum'
            WHEN 'r' THEN 'range'
        END AS "objectType",
        COALESCE(
            obj_description(COALESCE(pg_class.oid, pg_type.oid)), 
            obj_description(pg_type.oid)
        ) AS description
    FROM 
        pg_catalog.pg_type
    JOIN 
        pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
    FULL OUTER JOIN 
        pg_catalog.pg_class ON pg_type.typrelid = pg_class.oid
    WHERE 
        (
            pg_class.oid IS NULL 
            OR (
                pg_class.relispartition = false 
                AND pg_class.relkind NOT IN ('S')
                -- AND pg_class.oid NOT IN (CLASS OIDs HERE)
            )
        )
        -- AND pg_type.oid NOT IN (TYPE OIDS HERE)
        AND pg_type.typtype IN ('c', 'd', 'e', 'r')
        AND pg_namespace.nspname IN (${generatePgParameters(schemas)});`;

  let queryResult;
  try {
    queryResult = await db.query(query, schemas);
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`SQL Error: ${err.message}`);
    } else {
      throw new Error(`An unknown error occurred: ${String(err)}`);
    }
  }

  if (queryResult.rowCount === 0) {
    throw new Error(
      `Error introspecting database: No objects in database for schemas: ${schemas
        .map((schema) => `'${schema}'`)
        .join(', ')}`
    );
  }

  const databaseObjects = queryResult.rows;

  if (queryResultIsDatabaseObjectList(databaseObjects)) {
    return databaseObjects;
  } else {
    throw new Error(`Error introspecting database: Unexpected data format returned from getDatabaseObjects query.
      Expected: DatabaseObject[]
      Received: ${queryResult.rows.join('\n')}`);
  }
}

function queryResultIsDatabaseObjectList(
  databaseObjects: unknown
): databaseObjects is DatabaseObject[] {
  if (!Array.isArray(databaseObjects)) {
    return false;
  }
  return databaseObjects.every(isDatabaseObject);
}

function isDatabaseObject(obj: unknown): obj is DatabaseObject {
  return !!(
    obj &&
    typeof obj === 'object' &&
    'objectName' in obj &&
    typeof obj.objectName === 'string' &&
    'schema' in obj &&
    typeof obj.schema === 'string' &&
    'objectType' in obj &&
    typeof obj.objectType === 'string' &&
    'description' in obj &&
    (obj.description === null || typeof obj.description === 'string')
  );
}
