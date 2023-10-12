WITH fk_references AS (
    SELECT
        con.oid AS constraint_oid,
        JSON_AGG(JSON_BUILD_OBJECT(
            'columnName', refattr.attname,
            'namespaceOid', refns.oid,
            'tableOid', reftbl.oid,
            'columnAttNum', refattr.attnum
        )) FILTER (WHERE con.contype = 'f') AS "references"
    FROM
        pg_catalog.pg_constraint AS con
    LEFT JOIN
        pg_catalog.pg_attribute AS refattr
        ON
            con.confrelid = refattr.attrelid
            AND refattr.attnum = ANY(con.confkey)
    LEFT JOIN
        pg_catalog.pg_class AS reftbl ON con.confrelid = reftbl.oid
    LEFT JOIN
        pg_catalog.pg_namespace AS refns ON reftbl.relnamespace = refns.oid
    WHERE
        refns.oid = ANY($1)
    GROUP BY
        con.oid
)

SELECT
    aggregated.*,
    fk."references"
FROM (
    SELECT
        con.conname AS "name",
        con.oid AS "oid",
        con.conrelid AS "parentOid",
        tbl.relkind AS "parentKind",
        con.contype AS "type",
        con.confupdtype AS "onUpdate",
        con.confdeltype AS "onDelete",
        con.confmatchtype AS "matchType",
        con.condeferrable AS "isDeferrable",
        con.condeferred AS "isDeferred",
        ARRAY_AGG(attr.attname) AS "columnNames",
        PG_GET_CONSTRAINTDEF(con.oid) AS "definition"
    FROM
        pg_catalog.pg_constraint AS con
    INNER JOIN
        pg_catalog.pg_class AS tbl ON con.conrelid = tbl.oid
    LEFT JOIN
        pg_catalog.pg_attribute AS attr
        ON con.conrelid = attr.attrelid AND attr.attnum = ANY(con.conkey)
    WHERE
        tbl.relnamespace = ANY($1)
    GROUP BY
        con.conname,
        con.oid,
        con.conrelid,
        con.contype,
        con.confupdtype,
        con.confdeltype,
        con.confmatchtype,
        con.condeferrable,
        con.condeferred,
        tbl.relkind
) AS aggregated
LEFT JOIN
    fk_references AS fk ON aggregated.oid = fk.constraint_oid;
