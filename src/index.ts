import type { DatabaseObject, DatabaseObjectType } from '@/types/Database';
import type { ClientConfig } from 'pg';
import {
  validateNamespacesQuery,
  validateRelationsQuery,
  validateColumnsQuery,
  validateConstraintsQuery,
} from './validators';
import instantiateDatabaseConnection from '@/database';
import { executeSqlFile } from './utils/sqlHelpers';
import assert from 'assert';

const introspectDatabase = async (connectionConfig: ClientConfig) => {
  const db = await instantiateDatabaseConnection(connectionConfig);
  try {
    await db.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    const namespaceQueryResult = await executeSqlFile(db, 'namespaces');
    const namespaces = validateNamespacesQuery(namespaceQueryResult);
    assert(namespaces.length > 0, 'No namespaces found in database');

    const namespaceOids = namespaces.map((ns) => ns.oid);

    const relationsQueryResult = await executeSqlFile(
      db,
      'relations',
      namespaceOids
    );
    const relations = validateRelationsQuery(relationsQueryResult);

    const columnsQueryResult = await executeSqlFile(
      db,
      'columns',
      namespaceOids
    );
    const columns = validateColumnsQuery(columnsQueryResult);

    const constraintsQueryResult = await executeSqlFile(
      db,
      'constraints',
      namespaceOids
    );
    const constraints = validateConstraintsQuery(constraintsQueryResult);

    console.dir(constraints, { depth: 7 });
  } catch (err) {
    throw err;
  } finally {
    await db.query('ROLLBACK'); // assure no changes to the database
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
