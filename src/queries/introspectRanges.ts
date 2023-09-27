import type { Client } from 'pg';
import type { DatabaseObject } from '@/types/Database';
import {
  handleQueryReturnedNoResults,
  handleSqlQueryError,
} from '@/utils/errorHandlers';

export default async function introspectRanges<
  T extends (DatabaseObject & { objectType: 'range' })[],
>(db: Client, schema: string, databaseObjects: T) {
  if (!databaseObjects.length) {
    return {};
  }

  const ranges = databaseObjects.map((t) => t.objectName);

  let queryResult;
  try {
    queryResult = await db.query(query, [schema, ranges]);
  } catch (err) {
    throw handleSqlQueryError(err, schema, 'ranges');
  }

  if (queryResult.rowCount === 0) {
    throw handleQueryReturnedNoResults(databaseObjects, schema, 'ranges');
  }

  return queryResult.rows;
}

// TODO: actually understand collation/canonical
const query = `
    WITH range_details AS (
        SELECT
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
            n.nspname = $1 AND t.typname = ANY($2)
    )

        SELECT
            json_object_agg(
                range_name,
                json_build_object(
                    'subtype', subtype,
                    'collation', range_collation,
                    'canonicalFunction', canonical_function,
                    'subtypeDiffFunction', subtype_diff_function
                )
            ) AS result
        FROM
            range_details
        GROUP BY
            range_name;
  `;
