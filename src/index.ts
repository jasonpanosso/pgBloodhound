import type { DatabaseObject, DatabaseObjectType } from '@/types/Database';
import type { ClientConfig } from 'pg';
import getSchemaNames from '@/queries/getSchemaNames';
import getDatabaseObjectsFromSchema from '@/queries/getDatabaseObjects';
import instantiateDatabaseConnection from '@/database';
import introspectSchemaTables from '@/queries/introspectSchemaTables';
import introspectSchemaEnums from '@/queries/introspectSchemaEnums';
import introspectSchemaViews from './queries/introspectSchemaViews';
import introspectSchemaRanges from './queries/introspectSchemaRanges';

const introspectDatabase = async (connectionConfig: ClientConfig) => {
  const db = await instantiateDatabaseConnection(connectionConfig);
  try {
    await db.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    const schemas = await getSchemaNames(db);
    console.log('Schemas: ', schemas);

    const pgObjects = await getDatabaseObjectsFromSchema(db, ['public']);

    console.dir(pgObjects, { depth: 7 });

    const {
      tables,
      enums,
      views,
      materializedViews,
      ranges,
      domains,
      compositeTypes,
    } = sortDatabaseObjectsByType(pgObjects);

    const introspectedTables = await introspectSchemaTables(db, tables);
    console.dir(introspectedTables, { depth: 7 });

    const introspectedEnums = await introspectSchemaEnums(db, enums);
    console.dir(introspectedEnums, { depth: 7 });

    // TODO: add dimensions fix for materialized views
    const introspectedMaterializedViews = await introspectSchemaViews(
      db,
      materializedViews
    );
    console.dir(introspectedMaterializedViews, { depth: 7 });

    const introspectedViews = await introspectSchemaViews(db, views);
    console.dir(introspectedViews, { depth: 7 });

    const introspectedRanges = await introspectSchemaRanges(db, ranges);
    console.dir(introspectedRanges, { depth: 7 });
  } catch (err) {
    console.error(err);
  } finally {
    await db.query('COMMIT');
    await db.end();
  }
};

function filterObjectsByType<T extends DatabaseObjectType>(
  objects: DatabaseObject[],
  type: T
): (DatabaseObject & { objectType: T })[] {
  return objects.filter(
    (obj): obj is DatabaseObject & { objectType: T } => obj.objectType === type
  );
}

type SortedDatabaseObjects = {
  [K in DatabaseObjectType as K extends K
    ? `${K}s`
    : never]: (DatabaseObject & { objectType: K })[];
};

function sortDatabaseObjectsByType(
  databaseObjects: DatabaseObject[]
): SortedDatabaseObjects {
  return {
    tables: filterObjectsByType(databaseObjects, 'table'),
    enums: filterObjectsByType(databaseObjects, 'enum'),
    compositeTypes: filterObjectsByType(databaseObjects, 'compositeType'),
    views: filterObjectsByType(databaseObjects, 'view'),
    materializedViews: filterObjectsByType(databaseObjects, 'materializedView'),
    ranges: filterObjectsByType(databaseObjects, 'range'),
    domains: filterObjectsByType(databaseObjects, 'domain'),
  };
}

// temp: testing
const config: ClientConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 54322,
};

void introspectDatabase(config);
