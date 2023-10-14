SELECT
    t.typname AS "name",
    t.oid AS "oid",
    ns.oid AS "parentOid",
    des.description AS "description",
    CASE
        WHEN col.oid IS NOT NULL THEN
            JSONB_BUILD_OBJECT(
                'name', col.collname,
                'oid', col.oid,
                'encoding', col.collencoding,
                'collate', col.collcollate,
                'cType', col.collctype
            )
    END AS "collation",
    NULLIF(r.rngcanonical::REGPROC::TEXT, '-') AS "canonicalFunction",
    NULLIF(r.rngsubdiff::REGPROC::TEXT, '-') AS "subtypeDiffFunction",
    pg_catalog.FORMAT_TYPE(r.rngsubtype, NULL) AS "subtype"
FROM
    pg_catalog.pg_type AS t
INNER JOIN
    pg_catalog.pg_range AS r ON t.oid = r.rngtypid
INNER JOIN
    pg_catalog.pg_namespace AS ns ON t.typnamespace = ns.oid
LEFT JOIN
    pg_catalog.pg_description AS des ON t.oid = des.objoid
LEFT JOIN
    pg_catalog.pg_collation AS col ON r.rngcollation = col.oid
WHERE
    t.typtype = 'r'
    AND ns.oid = ANY($1);
