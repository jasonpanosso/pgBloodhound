SELECT
    t.typname AS "name",
    t.oid AS "oid",
    ns.oid AS "parentOid",
    JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'name', a.attname,
            'dataType', FORMAT_TYPE(a.atttypid, a.atttypmod),
            'typeCategory', field_type.typtype,
            'domainBaseType', domain_base_type.typname,
            'dimensions', a.attndims,
            'isArray', COALESCE(a.attndims > 0, FALSE)
        )
    ) AS "fields"
FROM
    pg_type AS t
INNER JOIN
    pg_namespace AS ns ON t.typnamespace = ns.oid
INNER JOIN
    pg_attribute AS a ON a.attnum > 0 AND t.typrelid = a.attrelid
INNER JOIN
    pg_type AS field_type ON a.atttypid = field_type.oid
LEFT JOIN
    pg_type AS domain_base_type ON field_type.typbasetype = domain_base_type.oid
WHERE
    t.typtype = 'c'
    AND ns.oid = ANY($1)
GROUP BY
    t.typname,
    t.oid,
    ns.oid;
