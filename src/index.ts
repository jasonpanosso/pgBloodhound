import type { DatabaseObject, DatabaseObjectType } from '@/types/Database';
import type { ClientConfig } from 'pg';
import getSchemaNames from '@/queries/getSchemaNames';
import getDatabaseObjectsFromSchema from '@/queries/getDatabaseObjects';
import instantiateDatabaseConnection from '@/database';
import introspectTables from '@/queries/introspectTables';
import introspectEnums from '@/queries/introspectEnums';
import introspectViews from './queries/introspectViews';
import introspectRanges from './queries/introspectRanges';
import introspectDomains from './queries/introspectDomains';
import introspectCompositeTypes from './queries/introspectCompositeTypes';

// temp
interface SchemaDetails {
  tables: Awaited<ReturnType<typeof introspectTables>>;
  enums: Awaited<ReturnType<typeof introspectEnums>>;
  views: Awaited<ReturnType<typeof introspectViews>>;
  materializedViews: Awaited<ReturnType<typeof introspectViews>>;
  ranges: Awaited<ReturnType<typeof introspectRanges>>;
  domains: Awaited<ReturnType<typeof introspectDomains>>;
  compositeTypes: Awaited<ReturnType<typeof introspectCompositeTypes>>;
}

const introspectDatabase = async (connectionConfig: ClientConfig) => {
  const db = await instantiateDatabaseConnection(connectionConfig);
  try {
    await db.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    const schemas = await getSchemaNames(db);
    console.log('Schemas: ', schemas);

    const result: Record<string, SchemaDetails> = {};
    for (const schema of schemas) {
      const pgObjects = await getDatabaseObjectsFromSchema(db, schema);

      const {
        tables,
        enums,
        views,
        materializedViews,
        ranges,
        domains,
        compositeTypes,
      } = sortDatabaseObjectsByType(pgObjects);

      result[schema] = {
        tables: await introspectTables(db, schema, tables),
        enums: await introspectEnums(db, schema, enums),
        views: await introspectViews(db, schema, views),
        materializedViews: await introspectViews(db, schema, materializedViews),
        ranges: await introspectRanges(db, schema, ranges),
        domains: await introspectDomains(db, schema, domains),
        compositeTypes: await introspectCompositeTypes(
          db,
          schema,
          compositeTypes
        ),
      };
    }

    console.dir(result, { depth: 10 });
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    await db.query('ROLLBACK');
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

// inconsequential type, a generic with the same content would not work.
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
