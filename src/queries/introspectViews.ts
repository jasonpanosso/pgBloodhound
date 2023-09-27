import type { Client } from 'pg';
import type { DatabaseObject } from '@/types/Database';
import {
  handleQueryReturnedMoreThanOneResult,
  handleQueryReturnedNoResults,
  handleSqlQueryError,
} from '@/utils/errorHandlers';
import { z } from 'zod';
import { viewValidator } from '@/types/ZodValidators';

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
  } else if (queryResult.rows.length !== 1) {
    throw handleQueryReturnedMoreThanOneResult(
      databaseObjects,
      schema,
      'views'
    );
  }

  return z
    .object({ result: z.record(viewValidator.strict()) })
    .strict()
    .parse(queryResult.rows[0]).result;
}

// TODO: add dimensions fix for materialized views & fix generated
const query = `
    WITH combined_details AS (
        SELECT
            n.nspname AS table_schema,
            c.relname AS table_name,
            a.attname AS column_name,
            a.attndims AS dimensions,
            a.attnum,
            a.attnotnull,
            pg_catalog.pg_get_expr(ad.adbin, ad.adrelid) AS column_default,
            pg_catalog.format_type(a.atttypid, a.atttypmod) AS pg_type,
            CASE
                WHEN c.relkind = 'm' THEN 'materializedView'
                WHEN c.relkind = 'v' THEN 'view'
            END AS view_type,
            CASE
                WHEN pg_catalog.format_type(a.atttypid, a.atttypmod) ~ '\\[\\]+' THEN true
                ELSE false
            END AS is_array,
            CASE 
                WHEN t.typname = 'numeric' THEN a.atttypmod - 4
                ELSE NULL
            END AS numeric_precision,
            CASE 
                WHEN t.typname = 'character varying' THEN a.atttypmod - 4
                ELSE NULL
            END AS char_max_length
        FROM
            pg_catalog.pg_attribute AS a
        LEFT JOIN 
            pg_catalog.pg_attrdef AS ad ON a.attnum = ad.adnum AND a.attrelid = ad.adrelid
        INNER JOIN
            pg_catalog.pg_class AS c ON a.attrelid = c.oid
        INNER JOIN
            pg_catalog.pg_namespace AS n ON c.relnamespace = n.oid
        INNER JOIN
            pg_catalog.pg_type AS t ON a.atttypid = t.oid
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
            JSON_BUILD_OBJECT(
                'columns', JSON_OBJECT_AGG(
                    column_name,
                    JSON_BUILD_OBJECT(
                        'columnName', column_name,
                        'pgType', pg_type,
                        'isNullable', NOT attnotnull,
                        'isIdentity', FALSE,
                        'typeDetails', pg_type,
                        'typeCategory', 'base',
                        'isArray', is_array,
                        'dimensions', dimensions,
                        'numericPrecision', numeric_precision,
                        'charMaxLength', char_max_length,
                        'columnDefault', column_default,
                        'generated', 'ALWAYS', -- TODO/TEMP
                        'constraints', NULL
                    )
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
