-- TODO: Add dimensions fix for materialized views
WITH combined_details AS (
    SELECT
        c.relname AS table_name,
        a.attname AS column_name,
        a.attndims AS dimensions,
        a.attnum,
        a.attnotnull,
        pg_catalog.PG_GET_EXPR(ad.adbin, ad.adrelid) AS column_default,
        pg_catalog.FORMAT_TYPE(a.atttypid, a.atttypmod) AS pg_type,
        CASE
            WHEN c.relkind = 'm' THEN 'materializedView'
            WHEN c.relkind = 'v' THEN 'view'
        END AS view_type,
        COALESCE(
            pg_catalog.FORMAT_TYPE(a.atttypid, a.atttypmod) ~ '\\[\\]+',
            FALSE
        ) AS is_array,
        CASE
            WHEN t.typname = 'numeric' THEN a.atttypmod - 4
        END AS numeric_precision,
        CASE
            WHEN t.typname = 'character varying' THEN a.atttypmod - 4
        END AS char_max_length
    FROM
        pg_catalog.pg_attribute AS a
    LEFT JOIN
        pg_catalog.pg_attrdef
        AS ad ON a.attnum = ad.adnum AND a.attrelid = ad.adrelid
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
        ) AS aggregated_columns
    FROM
        combined_details
    GROUP BY
        table_name, view_type
)

SELECT JSON_OBJECT_AGG(table_name, aggregated_columns) AS result
FROM
    column_details
GROUP BY
    view_type;
