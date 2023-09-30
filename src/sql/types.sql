WITH composite_type_details AS (
    SELECT
        t.typname AS composite_type_name,
        a.attname AS field_name,
        a.attndims AS dimensions,
        y.typtype AS type_category,
        y.typname AS type_details,
        FORMAT_TYPE(a.atttypid, a.atttypmod) AS field_type,
        COALESCE(a.attndims > 0, FALSE) AS is_array
    FROM
        pg_type AS t
    INNER JOIN
        pg_namespace AS n ON t.typnamespace = n.oid
    INNER JOIN
        pg_attribute AS a ON a.attnum > 0 AND t.typrelid = a.attrelid
    INNER JOIN
        pg_type AS y ON a.atttypid = y.oid
    WHERE
        t.typtype = 'c'
        AND n.nspname = $1 AND t.typname = ANY($2)
),

multiple_composite_type_aggregation AS (
    SELECT
        composite_type_name,
        JSON_OBJECT_AGG(
            field_name,
            JSON_BUILD_OBJECT(
                'pgType', field_type,
                'isNullable', TRUE,
                'isArray', is_array,
                'dimensions', dimensions,
                'typeDetails', type_details,
                'typeCategory', type_category
            )
        ) AS composite_type_aggregation
    FROM
        composite_type_details
    GROUP BY
        composite_type_name
)

SELECT
    JSON_OBJECT_AGG(composite_type_name, composite_type_aggregation)
    AS result
FROM
    multiple_composite_type_aggregation;
