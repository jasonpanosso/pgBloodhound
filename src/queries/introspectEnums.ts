import type { Client } from 'pg';
import type { DatabaseObject } from '@/types/Database';
import {
  handleQueryReturnedMoreThanOneResult,
  handleQueryReturnedNoResults,
  handleSqlQueryError,
} from '@/utils/errorHandlers';
import { z } from 'zod';
import { enumValidator } from '@/types/ZodValidators';

export default async function introspectEnums<
  T extends (DatabaseObject & { objectType: 'enum' })[],
>(db: Client, schema: string, databaseObjects: T) {
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
  } else if (queryResult.rows.length !== 1) {
    throw handleQueryReturnedMoreThanOneResult(
      databaseObjects,
      schema,
      'enums'
    );
  }

  return z
    .object({ result: z.record(z.array(z.string())) })
    .parse(queryResult.rows[0]).result;
}

const query = `
    WITH enum_details AS (
        SELECT 
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
            enum_type
    )
        SELECT
            json_object_agg(enum_type, enum_values) AS result
        FROM 
            enum_details;
  `;
