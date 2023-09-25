import type { Client } from 'pg';
import { generatePairedPgParameters } from '@/utils/queryUtils';
import type { DatabaseObject } from '@/types/Database';

export default async function introspectSchemaRanges<
  T extends (DatabaseObject & { objectType: 'range' })[],
>(db: Client, databaseObjects: T) {
  const pgParameters = generatePairedPgParameters(databaseObjects);
  const rangeAndSchemaNames = databaseObjects.flatMap((t) => [
    t.schema,
    t.objectName,
  ]);

  // TODO: actually understand collation/canonical
  const query = `
    WITH range_details AS (
        SELECT
            n.nspname AS schema_name,
            t.typname AS range_name,
            r.rngcanonical::regproc::text AS canonical_function,
            r.rngsubdiff::regproc::text AS subtype_diff_function,
            pg_catalog.format_type(r.rngsubtype, null) AS subtype,
            r.rngcollation::regnamespace::text
            || '.'
            || r.rngcollation::regtype::text AS range_collation
        FROM
            pg_catalog.pg_type AS t
        INNER JOIN
            pg_catalog.pg_range AS r ON t.oid = r.rngtypid
        INNER JOIN
            pg_catalog.pg_namespace AS n ON t.typnamespace = n.oid
        WHERE
            (n.nspname, t.typname) IN (${pgParameters})
    ),

    schema_ranges AS (
        SELECT
            schema_name,
            json_object_agg(
                range_name,
                json_build_object(
                    'subtype', subtype,
                    'collation', range_collation,
                    'canonicalFunction', canonical_function,
                    'subtypeDiffFunction', subtype_diff_function
                )
            ) AS ranges
        FROM
            range_details
        GROUP BY
            schema_name
    )

    SELECT
        json_object_agg(
            schema_name,
            json_build_object('ranges', ranges)
        ) AS schemas
    FROM
        schema_ranges;
  `;

  let queryResult;
  try {
    queryResult = await db.query(query, rangeAndSchemaNames);
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
