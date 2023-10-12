SELECT
    ns.oid AS "oid",
    ns.nspname AS "name"
FROM
    pg_catalog.pg_namespace AS ns
WHERE
    ns.nspname != 'information_schema'
    AND ns.nspname NOT LIKE 'pg_%'
    AND ns.nspname NOT IN (SELECT unnest($1::text []));
