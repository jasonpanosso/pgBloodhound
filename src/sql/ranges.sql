WITH range_details AS (
    SELECT
        t.typname AS range_name,
        r.rngcanonical::regproc::text AS canonical_function,
        r.rngsubdiff::regproc::text AS subtype_diff_function,
        pg_catalog.FORMAT_TYPE(r.rngsubtype, null) AS subtype,
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
    JSON_OBJECT_AGG(
        range_name,
        JSON_BUILD_OBJECT(
            'subtype', subtype,
            'collation', range_collation,
            'canonicalFunction', canonical_function,
            'subtypeDiffFunction', subtype_diff_function
        )
    ) AS result
FROM
    range_details;
