import type { ClientConfig } from 'pg';
import { instantiateDatabaseConnection, getDatabaseObjects } from '@/database';
import {
  mapRelationsWithNestedColumnsAndConstraints,
  sortRelationsIntoNamespaces,
} from './utils/relationSchemaMappers';

async function fetchDatabaseObjects(connectionConfig: ClientConfig) {
  const db = await instantiateDatabaseConnection(connectionConfig);
  return await getDatabaseObjects(db);
}

export async function introspectDatabase(connectionConfig: ClientConfig) {
  const { namespaces, relations, columns, constraints } =
    await fetchDatabaseObjects(connectionConfig);

  const mappedRelations = mapRelationsWithNestedColumnsAndConstraints(
    relations,
    columns,
    constraints
  );

  const namespacesWithRelations = sortRelationsIntoNamespaces(
    mappedRelations,
    namespaces
  );

  console.dir(namespacesWithRelations, { depth: 10 });
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
