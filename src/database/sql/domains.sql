SELECT
    ns.nspname AS "schemaName",
    t.typname AS "domainName",
    t.typdefault AS "defaultValue",
    pg_catalog.FORMAT_TYPE(t.typbasetype, t.typtypmod) AS "baseType"
FROM
    pg_catalog.pg_type AS t
INNER JOIN
    pg_catalog.pg_namespace AS ns ON t.typnamespace = ns.oid
WHERE
    t.typtype = 'd'
    AND ns.nspname = ANY($1);
