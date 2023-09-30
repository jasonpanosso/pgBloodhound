SELECT
    ns.nspname AS "schemaName",
    t.typname AS "enumType",
    ARRAY_AGG(e.enumlabel ORDER BY e.enumsortorder) AS "enumValues"
FROM
    pg_type AS t
INNER JOIN pg_enum AS e ON t.oid = e.enumtypid
INNER JOIN pg_catalog.pg_namespace AS ns ON t.typnamespace = ns.oid
WHERE
    t.typtype = 'e'
    AND ns.nspname = ANY($1);
