SELECT
    con.conname AS "constraintName",
    con.contype AS "constraintType",
    con.conrelid AS "parentOid",
    tbl.relname AS "tableName",
    ns.nspname AS "schemaName",
    con.confupdtype AS "onUpdate",
    con.confdeltype AS "onDelete",
    con.confmatchtype AS "matchType",
    con.condeferrable AS "isDeferrable",
    con.condeferred AS "isDeferred",
    PG_GET_CONSTRAINTDEF(con.oid) AS "checkConstraintDef",
    JSON_AGG(JSON_BUILD_OBJECT(
        'columnName', attr.attname,
        'references', CASE
            WHEN con.contype = 'f'
                THEN JSON_BUILD_OBJECT(
                    'referencedSchema', refns.nspname,
                    'referencedTable', reftbl.relname,
                    'referencedColumn', refattr.attname
                )
        END
    )) AS "references"
FROM
    pg_catalog.pg_constraint AS con
INNER JOIN
    pg_catalog.pg_class AS tbl ON con.conrelid = tbl.oid
INNER JOIN
    pg_catalog.pg_namespace AS ns ON tbl.relnamespace = ns.oid
LEFT JOIN
    pg_catalog.pg_attribute AS attr ON attr.attnum = ANY(con.conkey)
LEFT JOIN
    pg_catalog.pg_attribute AS refattr
    ON refattr.attnum = ANY(con.confkey) AND con.confrelid = refattr.attrelid
LEFT JOIN
    pg_catalog.pg_class AS reftbl ON con.confrelid = reftbl.oid
LEFT JOIN
    pg_catalog.pg_namespace AS refns ON reftbl.relnamespace = refns.oid
WHERE
    ns.nspname = ANY($1)
GROUP BY
    con.conname, con.contype, con.conrelid, tbl.relname, ns.nspname;
