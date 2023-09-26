import type { Client } from 'pg';
import type { DatabaseObject } from '@/types/Database';
import {
  handleQueryReturnedNoResults,
  handleSqlQueryError,
} from '@/utils/errorHandlers';

export default async function introspectCompositeTypes<
  T extends (DatabaseObject & { objectType: 'compositeType'; schema: K })[],
  K extends string,
>(db: Client, schema: K, databaseObjects: T) {
  if (!databaseObjects.length) {
    return {};
  }

  const compositeTypes = databaseObjects.map((t) => t.objectName);

  let queryResult;
  try {
    queryResult = await db.query(query, [schema, compositeTypes]);
  } catch (err) {
    throw handleSqlQueryError(err, schema, 'composite types');
  }

  if (queryResult.rowCount === 0) {
    throw handleQueryReturnedNoResults(
      databaseObjects,
      schema,
      'composite types'
    );
  }

  return queryResult.rows;
}

const query = `
    WITH composite_type_details AS (
        SELECT
            n.nspname AS schema_name,
            t.typname AS composite_type_name,
            a.attname AS field_name,
            format_type(a.atttypid, a.atttypmod) AS field_type,
            a.attndims AS dimensions,
            CASE 
                WHEN a.attndims > 0 THEN true
                ELSE false
            END AS isArray,
            y.typtype AS type_category,
            y.typname AS type_details
        FROM
            pg_type t
        INNER JOIN
            pg_namespace n ON n.oid = t.typnamespace
        INNER JOIN
            pg_attribute a ON a.attnum > 0 AND a.attrelid = t.typrelid
        INNER JOIN
            pg_type y ON y.oid = a.atttypid
        WHERE
            t.typtype = 'c'
            AND n.nspname = $1 AND t.typname = ANY($2)
    )
    SELECT
            json_object_agg(
                field_name,
                json_build_object(
                    'pgType', field_type,
                    'isNullable', true,
                    'isArray', isArray,
                    'dimensions', dimensions,
                    'typeDetails', type_details,
                    'typeCategory', type_category
                )
            ) AS result
    FROM
        composite_type_details
    GROUP BY
        schema_name, composite_type_name;
`;
