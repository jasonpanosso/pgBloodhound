import type { Client } from 'pg';
import type { DatabaseObject } from '@/types/Database';
import {
  handleQueryReturnedNoResults,
  handleSqlQueryError,
} from '@/utils/errorHandlers';

export default async function introspectViews<
  T extends (DatabaseObject & { objectType: 'view' | 'materializedView' })[],
>(db: Client, schema: string, databaseObjects: T) {
  if (!databaseObjects.length) {
    return {};
  }

  const views = databaseObjects.map((t) => t.objectName);

  let queryResult;
  try {
    queryResult = await db.query(query, [schema, views]);
  } catch (err) {
    throw handleSqlQueryError(err, schema, 'views');
  }

  if (queryResult.rowCount === 0) {
    throw handleQueryReturnedNoResults(databaseObjects, schema, 'views');
  }

  return queryResult.rows;
}

// TODO: add dimensions fix for materialized views
const query = `
    WITH combined_details AS (
        SELECT
            n.nspname AS table_schema,
            c.relname AS table_name,
            a.attname AS column_name,
            a.attndims AS dimensions,
            a.attnum,
            pg_catalog.format_type(a.atttypid, a.atttypmod) AS pg_type,
            NOT COALESCE(a.attnotnull, FALSE) AS is_nullable,
            CASE
                WHEN c.relkind = 'm' THEN 'materializedView'
                WHEN c.relkind = 'v' THEN 'view'
            END AS view_type,
            CASE
                WHEN pg_catalog.format_type(a.atttypid, a.atttypmod) ~ '\\[\\]+' THEN true
                ELSE false
            END AS is_array
            FROM
            pg_catalog.pg_attribute AS a
        INNER JOIN
            pg_catalog.pg_class AS c ON a.attrelid = c.oid
        INNER JOIN
            pg_catalog.pg_namespace AS n ON c.relnamespace = n.oid
        WHERE
            (c.relkind = 'm' OR c.relkind = 'v')
            AND a.attnum > 0
            AND NOT a.attisdropped
            AND n.nspname = $1 AND c.relname = ANY($2)
    ),

    column_details AS (
        SELECT
            table_schema,
            table_name,
            view_type,
            JSON_OBJECT_AGG(
                column_name,
                JSON_BUILD_OBJECT(
                    'columnName', column_name,
                    'pgType', pg_type,
                    'isNullable', is_nullable,
                    'isIdentity', FALSE,
                    'typeDetails', pg_type,
                    'typeCategory', 'base',
                    'isArray', is_array,
                    'dimensions', dimensions,
                    'constraints', NULL
                )
            ) AS columns
        FROM
            combined_details
        GROUP BY
            table_schema, table_name, view_type
    )

    SELECT
        JSON_OBJECT_AGG(table_name, columns) AS result
    FROM
        column_details
    GROUP BY
        table_schema, view_type;
  `;
