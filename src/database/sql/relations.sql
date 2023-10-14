SELECT
    c.oid AS "oid",
    c.relnamespace AS "parentOid",
    c.relkind AS "kind",
    c.relname AS "name",
    d.description AS "description"
FROM
    pg_class AS c
LEFT JOIN
    pg_description AS d ON c.oid = d.objoid
WHERE
    c.relkind IN ('r', 'v', 'm', 'p')
    AND c.relnamespace = ANY($1::oid [])
ORDER BY
    c.relnamespace,
    LOWER(c.relname);
