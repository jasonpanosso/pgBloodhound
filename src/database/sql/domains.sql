SELECT
    t.typname AS "name",
    t.oid AS "oid",
    ns.oid AS "parentOid",
    t.typdefault AS "defaultValue",
    pg_catalog.FORMAT_TYPE(t.typbasetype, t.typtypmod) AS "type"
FROM
    pg_catalog.pg_type AS t
INNER JOIN
    pg_catalog.pg_namespace AS ns ON t.typnamespace = ns.oid
WHERE
    t.typtype = 'd'
    AND ns.oid = ANY($1);
