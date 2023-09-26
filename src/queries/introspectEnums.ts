import type { Client } from 'pg';
import type { DatabaseObject } from '@/types/Database';
import {
  handleQueryReturnedNoResults,
  handleSqlQueryError,
} from '@/utils/errorHandlers';

export default async function introspectEnums<
  T extends (DatabaseObject & { objectType: 'enum'; schema: K })[],
  K extends string,
>(db: Client, schema: K, databaseObjects: T) {
  if (!databaseObjects.length) {
    return {};
  }

  const enums = databaseObjects.map((obj) => obj.objectName);

  let queryResult;
  try {
    queryResult = await db.query(query, [schema, enums]);
  } catch (err) {
    throw handleSqlQueryError(err, schema, 'enums');
  }

  if (queryResult.rowCount === 0) {
    throw handleQueryReturnedNoResults(databaseObjects, schema, 'enums');
  }

  return queryResult.rows;
}

const query = `
    WITH enum_details AS (
        SELECT 
            n.nspname as schema,
            t.typname as enum_type,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
        FROM 
            pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE 
            n.nspname = $1 AND
            t.typname = ANY($2)
        GROUP BY 
            schema, enum_type
    )
        SELECT
            json_object_agg(enum_type, enum_values) AS result
        FROM 
            enum_details
        GROUP BY
            schema;
  `;
