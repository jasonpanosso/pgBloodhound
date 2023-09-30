WITH domain_details AS (
    SELECT
        d.typname AS domain_name,
        d.typdefault AS default_value,
        pg_catalog.FORMAT_TYPE(d.typbasetype, d.typtypmod) AS base_type,
        ARRAY_AGG(dc.conname) AS constraint_names,
        ARRAY_AGG(
            pg_catalog.pg_get_constraintdef(dc.oid, true)
        ) AS constraint_definitions
    FROM
        pg_catalog.pg_type AS d
    INNER JOIN
        pg_catalog.pg_namespace AS n ON d.typnamespace = n.oid
    LEFT JOIN
        pg_collation AS c ON d.typcollation = c.oid
    LEFT JOIN
        pg_constraint AS dc ON d.oid = dc.contypid
    WHERE
        d.typtype = 'd'
        AND n.nspname = $1 AND d.typname = ANY($2)
    GROUP BY
        domain_name,
        default_value,
        base_type
)

SELECT
    JSON_OBJECT_AGG(
        domain_name,
        JSON_BUILD_OBJECT(
            'pgType', base_type,
            'defaultValue', default_value,
            'constraints',
            JSONB_OBJECT(constraint_names, constraint_definitions)
        )
    ) AS result
FROM
    domain_details;
