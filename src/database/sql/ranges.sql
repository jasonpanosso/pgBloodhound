SELECT
    t.typname AS "name",
    t.oid AS "oid",
    ns.oid AS "parentOid",
    r.rngcanonical::regproc::text AS "canonicalFunction",
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
    AND ns.oid = ANY($1);
