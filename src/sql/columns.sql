SELECT
    ns.nspname AS "schemaName",
    c.relname AS "parentName",
    c.relkind AS "parentKind",
    a.attname AS "columnName",
    a.attnotnull AS "notNull",
    PG_GET_EXPR(ad.adbin, ad.adrelid)::text AS "defaultWithTypeCast",
    d.description AS "description",
    FORMAT_TYPE(a.atttypid, a.atttypmod) AS "sqlType",
    CASE
        WHEN
            c.relkind = 'v'
            AND a.attndims = 0
            AND RIGHT(FORMAT_TYPE(a.atttypid, a.atttypmod), 2) = '[]'
            THEN 1
        ELSE a.attndims
    END AS "dimensions",
    a.attgenerated != '' AS "isGenerated"
FROM
    pg_catalog.pg_attribute AS a
INNER JOIN
    pg_catalog.pg_class AS c ON a.attrelid = c.oid
INNER JOIN
    pg_catalog.pg_namespace AS ns ON c.relnamespace = ns.oid
LEFT JOIN
    pg_catalog.pg_attrdef AS ad
    ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
LEFT JOIN
    pg_catalog.pg_description AS d
    ON a.attrelid = d.objoid AND a.attnum = d.objsubid
WHERE
    ns.nspname = ANY($1)
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND c.relkind IN ('m', 'r', 'v', 'c', 'p');
