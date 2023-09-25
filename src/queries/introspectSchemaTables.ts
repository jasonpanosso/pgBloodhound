import type { Client } from 'pg';
import { generatePairedPgParameters } from '@/utils/queryUtils';
import type { DatabaseObject } from '@/types/Database';

export default async function introspectSchemaTables<
  T extends (DatabaseObject & { objectType: 'table' })[],
>(db: Client, tables: T) {
  const tableAndSchemaNames = tables.flatMap((t) => [t.schema, t.objectName]);
  const pgParameters = generatePairedPgParameters(tables);

  const query = `
    WITH constraints_details AS (
        SELECT
            tc.table_schema,
            tc.table_name,
            kcu.column_name,
            json_agg(
                json_build_object(
                    'constraintType', tc.constraint_type,
                    'foreignKeyReference',
                    CASE
                        WHEN tc.constraint_type = 'FOREIGN KEY'
                            THEN (
                                SELECT
                                    concat(
                                        rc.unique_constraint_schema, '.',
                                        kcu_ref.table_name, '.', kcu.column_name
                                    )
                                FROM
                                    information_schema.referential_constraints AS rc
                                INNER JOIN
                                    information_schema.key_column_usage AS kcu_ref
                                    ON
                                        rc.unique_constraint_name
                                        = kcu_ref.constraint_name
                                WHERE rc.constraint_name = tc.constraint_name
                            )
                    END
                )
            ) AS constraints
        FROM
            information_schema.table_constraints AS tc
        INNER JOIN information_schema.key_column_usage AS kcu
            ON
                tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE
                (tc.table_schema, tc.table_name) IN (${pgParameters})
        GROUP BY
            tc.table_schema, tc.table_name, kcu.column_name
    ),

    type_details AS (
        SELECT
            pg_namespace.nspname AS table_schema,
            pg_class.relname AS table_name,
            pg_attribute.attname AS column_name,
            pg_type.typname AS type_name,
            CASE
                WHEN pg_type.typtype = 'c' THEN 'composite'
                WHEN pg_type.typtype = 'b' THEN 'base'
                WHEN pg_type.typtype = 'e' THEN 'enum'
                WHEN pg_type.typtype = 'd' THEN 'domain'
                WHEN pg_type.typtype = 'r' THEN 'range'
            END AS type_category,
            pg_type.typelem != 0 AND pg_type.typlen = -1 AS is_array
        FROM
            pg_attribute
        INNER JOIN pg_type ON pg_attribute.atttypid = pg_type.oid
        INNER JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
        INNER JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
        WHERE
            (pg_namespace.nspname, pg_class.relname) IN (${pgParameters})
    ),

    table_details AS (
        SELECT
            c.table_schema,
            c.table_name,
            json_build_object(
                'columnName', c.column_name,
                'pgType', CASE
                    WHEN
                        c.data_type = 'USER-DEFINED'
                        THEN concat(c.udt_schema, '.', c.udt_name)
                    ELSE c.data_type
                END,
                'columnDefault', c.column_default,
                'charMaxLength', c.character_maximum_length,
                'numericPrecision', c.numeric_precision,
                'isUpdateable',
                COALESCE (c.is_updatable = 'YES', FALSE),
                'isNullable',
                COALESCE (c.is_nullable = 'YES', FALSE),
                'isIdentity',
                COALESCE (c.is_identity = 'YES', FALSE),
                'typeDetails', td.type_name,
                'typeCategory', td.type_category,
                'isArray', td.is_array,
                'constraints', cd.constraints
            ) AS column_details
        FROM
            information_schema.columns AS c
        LEFT JOIN
            constraints_details AS cd
            ON
                c.table_schema = cd.table_schema
                AND c.table_name = cd.table_name
                AND c.column_name = cd.column_name
        LEFT JOIN
            type_details AS td
            ON
                c.table_schema = td.table_schema
                AND c.table_name = td.table_name
                AND c.column_name = td.column_name
        WHERE
            (c.table_schema, c.table_name) IN (${pgParameters})
    ),

    schema_details AS (
        SELECT
            table_schema,
            json_object_agg(table_name, column_details) AS tables
        FROM (
            SELECT
                table_schema,
                table_name,
                json_object_agg(
                    column_details ->> 'columnName', column_details
                ) AS column_details
            FROM
                table_details
            GROUP BY
                table_schema, table_name
        ) AS sub_query
        GROUP BY
            table_schema
    )

    SELECT json_object_agg(table_schema, json_build_object('tables', tables)) 
    AS schemas FROM schema_details;
  `;

  let queryResult;
  try {
    queryResult = await db.query(query, tableAndSchemaNames);
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`SQL Error while fetching table details: ${err.message}`);
    } else {
      throw new Error(
        `An unknown error occurred while fetching table details: ${String(err)}`
      );
    }
  }

  if (queryResult.rowCount === 0) {
    throw new Error(
      `Error introspecting database: Unable to introspect any data for tables:
        ${tables.map((table) => `'${table.objectName}'`).join(', ')}`
    );
  }

  return queryResult.rows;
}
