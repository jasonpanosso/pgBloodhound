SELECT
    a.attname AS "name",
    a.attnum AS "attNum",
    c.oid AS "parentOid",
    c.relkind AS "parentKind",
    a.attnotnull AS "notNull",
    PG_GET_EXPR(ad.adbin, ad.adrelid)::text AS "defaultWithTypeCast",
    d.description AS "description",
    FORMAT_TYPE(a.atttypid, a.atttypmod) AS "sqlType",
    CASE
        WHEN
            -- TODO: This needs to be fixed for views
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
LEFT JOIN
    pg_catalog.pg_attrdef AS ad
    ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
LEFT JOIN
    pg_catalog.pg_description AS d
    ON a.attrelid = d.objoid AND a.attnum = d.objsubid
WHERE
    c.relnamespace = ANY($1::oid [])
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND c.relkind IN ('m', 'r', 'v', 'c', 'p');
