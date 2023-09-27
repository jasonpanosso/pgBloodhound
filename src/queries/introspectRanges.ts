import type { Client } from 'pg';
import type { DatabaseObject } from '@/types/Database';
import {
  handleQueryReturnedMoreThanOneResult,
  handleQueryReturnedNoResults,
  handleSqlQueryError,
} from '@/utils/errorHandlers';
import { z } from 'zod';
import { rangeValidator } from '@/types/ZodValidators';

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
  } else if (queryResult.rows.length !== 1) {
    throw handleQueryReturnedMoreThanOneResult(
      databaseObjects,
      schema,
      'ranges'
    );
  }

  return z
    .object({ result: z.record(rangeValidator) })
    .parse(queryResult.rows[0]).result;
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
        range_details;
  `;
