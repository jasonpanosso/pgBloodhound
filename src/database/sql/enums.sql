SELECT
    t.typname AS "name",
    t.oid AS "oid",
    ns.oid AS "parentOid",
    JSON_AGG(e.enumlabel ORDER BY e.enumsortorder) AS "values"
FROM
    pg_type AS t
INNER JOIN pg_enum AS e ON t.oid = e.enumtypid
INNER JOIN pg_catalog.pg_namespace AS ns ON t.typnamespace = ns.oid
WHERE
    t.typtype = 'e'
    AND ns.oid = ANY($1)
GROUP BY
    ns.oid, t.typname, t.oid;
