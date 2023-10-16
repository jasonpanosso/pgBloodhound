SELECT
    t.typname AS "name",
    t.oid AS "oid",
    ns.oid AS "parentOid",
    t.typdefault AS "defaultValue",
    des.description AS "description",
    CASE
        WHEN col.oid IS NOT NULL THEN
            JSONB_BUILD_OBJECT(
                'name', col.collname,
                'oid', col.oid,
                'encoding', col.collencoding,
                'collate', col.collcollate,
                'cType', col.collctype
            )
    END AS "collation",
    JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'name', con.conname,
            'description', condesc.description,
            'isDeferrable', con.condeferrable,
            'isDeferred', con.condeferred,
            'isValidated', con.convalidated,
            'oid', con.oid,
            'definition', PG_GET_CONSTRAINTDEF(con.oid)
        )
    ) FILTER (WHERE con.oid IS NOT NULL) AS "constraints",
    pg_catalog.FORMAT_TYPE(t.typbasetype, t.typtypmod) AS "dataType"
FROM
    pg_catalog.pg_type AS t
INNER JOIN
    pg_catalog.pg_namespace AS ns ON t.typnamespace = ns.oid
LEFT JOIN
    pg_catalog.pg_constraint AS con ON t.oid = con.contypid
LEFT JOIN
    pg_catalog.pg_collation AS col ON t.typcollation = col.oid
LEFT JOIN
    pg_catalog.pg_description AS des ON t.oid = des.objoid
LEFT JOIN
    pg_catalog.pg_description AS condesc ON con.oid = condesc.objoid
WHERE
    t.typtype = 'd'
    AND ns.oid = ANY($1)
GROUP BY
    t.typname,
    t.oid,
    ns.oid,
    t.typdefault,
    col.oid,
    des.description;
