import type { Client } from 'pg';
import { generatePairedPgParameters } from '@/utils/queryUtils';
import type { DatabaseObject } from '@/types/Database';

export default async function introspectSchemaViews<
  T extends (DatabaseObject & { objectType: 'view' | 'materializedView' })[],
>(db: Client, databaseObjects: T) {
  const pgParameters = generatePairedPgParameters(databaseObjects);
  const viewAndSchemaNames = databaseObjects.flatMap((t) => [
    t.schema,
    t.objectName,
  ]);

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
            AND (n.nspname, c.relname) IN (${pgParameters})
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
                    'isUpdateable', FALSE,
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
    ),

    view_details AS (
        SELECT
            table_schema,
            CASE
                WHEN view_type = 'view' THEN 'views'
                WHEN view_type = 'materializedView' THEN 'materializedViews'
                ELSE view_type
            END AS plural_view_type,
            JSON_OBJECT_AGG(table_name, columns) AS view_data
        FROM
            column_details
        GROUP BY
            table_schema, view_type
    ),

    final_output AS (
        SELECT
            table_schema,
            JSON_OBJECT_AGG(
                plural_view_type,
                view_data
            ) AS schema_data
        FROM
            view_details
        GROUP BY
            table_schema
    )

    SELECT JSON_OBJECT_AGG(table_schema, schema_data) AS schemas FROM final_output;
  `;

  let queryResult;
  try {
    queryResult = await db.query(query, viewAndSchemaNames);
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`SQL Error while fetching view details: ${err.message}`);
    } else {
      throw new Error(
        `An unknown error occurred while fetching view details: ${String(err)}`
      );
    }
  }

  if (queryResult.rowCount === 0) {
    throw new Error(
      `Error introspecting database: Unable to find any data for views:
        ${databaseObjects.map((obj) => `'${obj.objectName}'`).join(', ')}`
    );
  }

  return queryResult.rows;
}
