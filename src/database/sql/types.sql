SELECT
    ns.nspname AS schema_name,
    t.typname AS composite_type_name,
    a.attname AS field_name,
    a.attndims AS dimensions,
    y.typtype AS type_category,
    y.typname AS type_details,
    FORMAT_TYPE(a.atttypid, a.atttypmod) AS field_type,
    COALESCE(a.attndims > 0, FALSE) AS is_array
FROM
    pg_type AS t
INNER JOIN
    pg_namespace AS ns ON t.typnamespace = ns.oid
INNER JOIN
    pg_attribute AS a ON a.attnum > 0 AND t.typrelid = a.attrelid
INNER JOIN
    pg_type AS y ON a.atttypid = y.oid
WHERE
    t.typtype = 'c'
    AND ns.nspname = ANY($1);
