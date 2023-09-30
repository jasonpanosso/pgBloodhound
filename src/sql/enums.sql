WITH enum_details AS (
    SELECT
        t.typname AS enum_type,
        ARRAY_AGG(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
    FROM
        pg_type AS t
    INNER JOIN pg_enum AS e ON t.oid = e.enumtypid
    INNER JOIN pg_catalog.pg_namespace AS n ON t.typnamespace = n.oid
    WHERE
        n.nspname = $1
        AND t.typname = ANY($2)
    GROUP BY
        enum_type
)

SELECT JSON_OBJECT_AGG(enum_type, enum_values) AS result
FROM
    enum_details;
