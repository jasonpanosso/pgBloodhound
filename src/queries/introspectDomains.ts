import type { Client } from 'pg';
import type { DatabaseObject } from '@/types/Database';
import {
  handleQueryReturnedNoResults,
  handleSqlQueryError,
} from '@/utils/errorHandlers';

export default async function introspectDomains<
  T extends (DatabaseObject & { objectType: 'domain' })[],
>(db: Client, schema: string, databaseObjects: T) {
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
        d.typname AS domain_name,
        d.typdefault AS default_value,
        pg_catalog.format_type(d.typbasetype, d.typtypmod) AS base_type,
        array_agg(dc.conname) AS constraint_names,
        array_agg(pg_catalog.pg_get_constraintdef(dc.oid, true)) AS constraint_definitions
    FROM
        pg_catalog.pg_type AS d
    INNER JOIN
        pg_catalog.pg_namespace AS n ON d.typnamespace = n.oid
    LEFT JOIN 
        pg_collation c ON d.typcollation = c.oid
    LEFT JOIN
        pg_constraint dc ON dc.contypid = d.oid
    WHERE
        d.typtype = 'd'
        AND n.nspname = $1 AND d.typname = ANY($2)
    GROUP BY
        domain_name,
        default_value,
        base_type
)
SELECT
      json_object_agg(
        domain_name,
        json_build_object(
            'pgType', base_type,
            'defaultValue', default_value,
            'constraints', jsonb_object(constraint_names, constraint_definitions)
        )
      ) AS result
FROM
    domain_details
GROUP BY
    domain_name;
  `;
