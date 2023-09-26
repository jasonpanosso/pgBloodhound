import type { Client } from 'pg';
import { generatePairedPgParameters } from '@/utils/queryUtils';
import type { DatabaseObject } from '@/types/Database';

export default async function introspectDomains<
  T extends (DatabaseObject & { objectType: 'domain' })[],
>(db: Client, databaseObjects: T) {
  const pgParameters = generatePairedPgParameters(databaseObjects);
  const domainAndSchemaNames = databaseObjects.flatMap((t) => [
    t.schema,
    t.objectName,
  ]);

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
            AND (n.nspname, d.typname) IN (${pgParameters})
    ),

    schema_domains AS(
        SELECT
            schema_name,
            json_object_agg(
                domain_name,
                json_build_object(
                    'baseType', base_type,
                    'defaultValue', default_value,
                    'collation', domain_collation
                )
            ) AS domains
        FROM
            domain_details
        GROUP BY
            schema_name
)
    SELECT
        json_object_agg(
            schema_name,
            json_build_object('domains', domains)
        ) AS schemas
    FROM
        schema_domains;
  `;

  let queryResult;
  try {
    queryResult = await db.query(query, domainAndSchemaNames);
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
