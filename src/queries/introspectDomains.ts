import type { Client } from 'pg';
import type { DatabaseObject } from '@/types/Database';
import {
  handleQueryReturnedNoResults,
  handleSqlQueryError,
} from '@/utils/errorHandlers';

export default async function introspectDomains<
  T extends (DatabaseObject & { objectType: 'domain'; schema: K })[],
  K extends string,
>(db: Client, schema: K, databaseObjects: T) {
  if (!databaseObjects.length) {
    return {};
  }

  const domains = databaseObjects.map((t) => t.objectName);

  let queryResult;
  try {
    queryResult = await db.query(query, [schema, domains]);
  } catch (err) {
    throw handleSqlQueryError(err, schema, 'domains');
  }

  if (queryResult.rowCount === 0) {
    throw handleQueryReturnedNoResults(databaseObjects, schema, 'domains');
  }

  return queryResult.rows;
}

const query = `
    WITH domain_details AS (
        SELECT
            n.nspname AS schema_name,
            d.typname AS domain_name,
            pg_catalog.format_type(d.typbasetype, d.typtypmod) AS base_type,
            d.typdefault AS default_value,
            d.typcollation::regnamespace::text || '.' || d.typcollation::regtype::text AS domain_collation
        FROM
            pg_catalog.pg_type AS d
        INNER JOIN
            pg_catalog.pg_namespace AS n ON d.typnamespace = n.oid
        WHERE
            d.typtype = 'd'
            AND n.nspname = $1 AND d.typname = ANY($2)
    )
        SELECT
              json_object_agg(
                domain_name,
                json_build_object(
                    'baseType', base_type,
                    'defaultValue', default_value,
                    'collation', domain_collation
                )
              ) AS result
        FROM
            domain_details
        GROUP BY
            schema_name;
  `;
