SELECT
    c.oid AS "oid",
    c.relnamespace AS "schemaOid",
    c.relkind AS "kind",
    c.relname AS "name",
    pg_catalog.obj_description(c.oid, 'pg_class') AS "description"
FROM
    pg_class AS c
WHERE
    c.relkind IN ('r', 'v', 'm', 'p', 'S')
    AND c.relnamespace = ANY($1)
ORDER BY
    c.relnamespace,
    LOWER(c.relname);
