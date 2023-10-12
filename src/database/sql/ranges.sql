SELECT
    ns.nspname AS "schemaName",
    t.typname AS "rangeName",
    r.rngcanonical::regproc::text AS "canonicalNunction",
    r.rngsubdiff::regproc::text AS "subtypeDiffFunction",
    pg_catalog.FORMAT_TYPE(r.rngsubtype, null) AS "subtype",
    r.rngcollation::regnamespace::text
    || '.'
    || r.rngcollation::regtype::text AS "rangeCollation"
FROM
    pg_catalog.pg_type AS t
INNER JOIN
    pg_catalog.pg_range AS r ON t.oid = r.rngtypid
INNER JOIN
    pg_catalog.pg_namespace AS ns ON t.typnamespace = ns.oid
WHERE
    t.typtype = 'r'
    AND ns.nspname = ANY($1);
