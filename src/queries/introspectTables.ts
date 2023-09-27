import type { Client } from 'pg';
import type { DatabaseObject } from '@/types/Database';
import {
  handleQueryReturnedNoResults,
  handleSqlQueryError,
} from '@/utils/errorHandlers';

export default async function introspectTables<
  T extends (DatabaseObject & { objectType: 'table' })[],
>(db: Client, schema: string, databaseObjects: T) {
  if (!databaseObjects.length) {
    return {};
  }

  const tables = databaseObjects.map((t) => t.objectName);

  let queryResult;
  try {
    queryResult = await db.query(query, [schema, tables]);
  } catch (err) {
    throw handleSqlQueryError(err, schema, 'tables');
  }

  if (queryResult.rowCount === 0) {
    throw handleQueryReturnedNoResults(databaseObjects, schema, 'tables');
  }

  return queryResult.rows;
}

const query = `
    WITH constraints_details AS (
        SELECT
            cls.relname AS table_name,
            attr.attname AS column_name,
            jsonb_object_agg(
                con.conname,
                jsonb_build_object(
                    'checkCondition', CASE
                        WHEN con.contype = 'c' THEN pg_get_constraintdef(con.oid)
                    END,
                    'constraintType', CASE
                        WHEN con.contype = 'c' THEN 'CHECK'
                        WHEN con.contype = 'f' THEN 'FOREIGN_KEY'
                        WHEN con.contype = 'p' THEN 'PRIMARY_KEY'
                        WHEN con.contype = 'u' THEN 'UNIQUE'
                        WHEN con.contype = 't' THEN 'TRIGGER'
                        WHEN con.contype = 'x' THEN 'EXCLUSION'
                    END,
                    'foreignKeyReferences', CASE
                        WHEN con.contype = 'f' THEN (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'schema', refns.nspname,
                                    'table', refcls.relname,
                                    'column', refattr.attname
                                )
                            )
                            FROM
                                pg_catalog.pg_attribute AS refattr
                            INNER JOIN pg_catalog.pg_class AS refcls ON refattr.attrelid = refcls.oid
                            INNER JOIN pg_catalog.pg_namespace AS refns ON refcls.relnamespace = refns.oid
                            WHERE 
                                refattr.attnum = ANY(con.confkey) AND refcls.oid = con.confrelid
                        )
                    END
                )
            )  FILTER (WHERE con.contype IS NOT NULL) AS constraints_aggregated
        FROM
            pg_catalog.pg_attribute AS attr
        INNER JOIN pg_catalog.pg_class AS cls ON attr.attrelid = cls.oid
        INNER JOIN pg_catalog.pg_constraint AS con 
            ON attr.attnum = ANY(con.conkey) AND con.conrelid = cls.oid
        INNER JOIN pg_catalog.pg_namespace AS ns ON cls.relnamespace = ns.oid
        WHERE
            ns.nspname = $1 AND cls.relname = any($2) AND cls.relkind = 'r'
        GROUP BY
            cls.relname, attr.attname
    ),

    type_details AS (
        SELECT
            cls.relname AS table_name,
            attr.attname AS column_name,
            attr.attndims AS dimensions,
            typ.typname AS type_name,
            CASE
                WHEN typ.typtype = 'c' THEN 'composite'
                WHEN typ.typtype = 'b' THEN 'base'
                WHEN typ.typtype = 'e' THEN 'enum'
                WHEN typ.typtype = 'd' THEN 'domain'
                WHEN typ.typtype = 'r' THEN 'range'
            END AS type_category,
            typ.typelem != 0 AND typ.typlen = -1 AS is_array
        FROM
            pg_catalog.pg_attribute AS attr
        INNER JOIN pg_catalog.pg_type AS typ ON attr.atttypid = typ.oid
        INNER JOIN pg_catalog.pg_class AS cls ON attr.attrelid = cls.oid
        INNER JOIN pg_catalog.pg_namespace AS ns ON cls.relnamespace = ns.oid
        WHERE
            ns.nspname = $1 AND cls.relname = any($2)
    ),

    table_details AS (
        SELECT
            cls.relname AS table_name,
            attr.attname AS column_name,
            json_build_object(
                'pgType', typ.typname,
                'columnDefault',
                pg_catalog.pg_get_expr(attrdef.adbin, attrdef.adrelid),
                'charMaxLength', CASE
                    WHEN typ.typlen > 0 THEN typ.typlen
                END,
                'numericPrecision', CASE
                    WHEN typ.typname = 'numeric' THEN attr.atttypmod
                END,
                'isNullable', NOT attr.attnotnull,
                'isIdentity', attr.attidentity = 'a' OR attr.attidentity = 'd',
                'generated', CASE
                    WHEN attr.attidentity = 'a' THEN 'ALWAYS'
                    WHEN attr.attidentity IN ('d', 's') THEN 'BY DEFAULT'
                    WHEN attr.attgenerated != '' THEN 'ALWAYS'
                    ELSE 'NEVER'
                END,
                'typeDetails', td.type_name,
                'typeCategory', td.type_category,
                'isArray', td.is_array,
                'dimensions', td.dimensions,
                'constraints', cd.constraints_aggregated
            ) AS column_details
        FROM
            pg_catalog.pg_attribute AS attr
        LEFT JOIN
            pg_catalog.pg_attrdef AS attrdef
            ON attr.attnum = attrdef.adnum AND attr.attrelid = attrdef.adrelid
        INNER JOIN pg_catalog.pg_class AS cls ON attr.attrelid = cls.oid
        INNER JOIN pg_catalog.pg_namespace AS ns ON cls.relnamespace = ns.oid
        INNER JOIN pg_catalog.pg_type AS typ ON attr.atttypid = typ.oid
        LEFT JOIN (
            SELECT * FROM constraints_details
        ) AS cd
        ON
            cls.relname = cd.table_name
            AND attr.attname = cd.column_name
        LEFT JOIN
            type_details AS td
            ON
                cls.relname = td.table_name
                AND attr.attname = td.column_name
        WHERE
            ns.nspname = $1 AND cls.relname = any($2)
            AND attr.attnum > 0 
    ),

    table_column_aggregation AS (
        SELECT
            table_name,
            json_build_object(
                'columns',
                json_object_agg(column_name, column_details)
            ) AS column_details
        FROM
            table_details
        GROUP BY
            table_name
    ),

    multiple_table_aggregation AS (
        SELECT json_object_agg(table_name, column_details) AS result
        FROM table_column_aggregation
    )

    SELECT result FROM multiple_table_aggregation;
  `;
