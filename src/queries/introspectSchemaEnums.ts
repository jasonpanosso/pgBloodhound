import type { Client } from 'pg';
import { generatePairedPgParameters } from '@/utils/queryUtils';
import type { DatabaseObject } from '@/types/Database';

export default async function introspectSchemaEnums<
  T extends (DatabaseObject & { objectType: 'enum' })[],
>(db: Client, databaseObjects: T) {
  const pgParameters = generatePairedPgParameters(databaseObjects);
  const enumAndSchemaNames = databaseObjects.flatMap((t) => [
    t.schema,
    t.objectName,
  ]);

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
            (n.nspname, t.typname) IN (${pgParameters})
        GROUP BY 
            schema, enum_type
    ),
    enum_details_aggregated AS (
        SELECT
            schema,
            json_object_agg(enum_type, enum_values) AS enums
        FROM 
            enum_details
        GROUP BY
            schema
    )
    SELECT 
        json_object_agg(schema, enums) AS schemas
    FROM 
        enum_details_aggregated;
  `;

  let queryResult;
  try {
    queryResult = await db.query(query, enumAndSchemaNames);
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`SQL Error while fetching table details: ${err.message}`);
    } else {
      throw new Error(
        `An unknown error occurred while fetching table details: ${String(err)}`
      );
    }
  }

  if (queryResult.rowCount === 0) {
    throw new Error(
      `Error introspecting database: Unable to find any enum details data for enums:
        ${databaseObjects.map((obj) => `'${obj.objectName}'`).join(', ')}`
    );
  }

  return queryResult.rows;
}
