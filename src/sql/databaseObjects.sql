-- TODO: Class & type exclusions
SELECT
    pg_type.typname AS "objectName",
    CASE pg_type.typtype
        WHEN 'c'
            THEN CASE pg_class.relkind
                WHEN 'r' THEN 'table'
                WHEN 'p' THEN 'table'
                WHEN 'v' THEN 'view'
                WHEN 'm' THEN 'materializedView'
                WHEN 'c' THEN 'compositeType'
            END
        WHEN 'd' THEN 'domain'
        WHEN 'e' THEN 'enum'
        WHEN 'r' THEN 'range'
    END AS "objectType",
    COALESCE(
        OBJ_DESCRIPTION(COALESCE(pg_class.oid, pg_type.oid)),
        OBJ_DESCRIPTION(pg_type.oid)
    ) AS description
FROM
    pg_catalog.pg_type
INNER JOIN
    pg_catalog.pg_namespace ON pg_type.typnamespace = pg_namespace.oid
FULL OUTER JOIN
    pg_catalog.pg_class ON pg_type.typrelid = pg_class.oid
WHERE
    (
        pg_class.oid IS NULL
        OR (
            pg_class.relispartition = FALSE
            AND pg_class.relkind NOT IN ('S')
            -- AND pg_class.oid NOT IN (CLASS OIDs HERE)
        )
    )
    -- AND pg_type.oid NOT IN (TYPE OIDS HERE)
    AND pg_type.typtype IN ('c', 'd', 'e', 'r')
    AND pg_namespace.nspname IN ($1);
