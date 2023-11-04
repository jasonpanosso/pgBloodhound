SELECT
  p.proname AS "name",
  p.oid AS "oid",
  p.pronamespace AS "parentOid",
  pg_catalog.pg_get_function_arguments(p.oid) AS "argumentDataTypes",
  pg_catalog.pg_get_function_result(p.oid) AS "returnDataType",
  p.prokind AS "type",
  p.proargdefaults AS "defaultValues",
  p.proretset AS "returnsSet"
FROM
  pg_catalog.pg_proc p
WHERE
    p.pronamespace = ANY($1)
GROUP BY
  p.pronamespace, p.oid
