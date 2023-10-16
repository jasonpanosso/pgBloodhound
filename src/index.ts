import type { BloodhoundConfig } from './types';
import type { ClientConfig } from 'pg';
import { instantiateDatabaseConnection, getDatabaseObjects } from '@/database';
import { buildSchema } from './utils/schemaBuilder';

async function fetchDatabaseObjects(
  connectionConfig: ClientConfig,
  namespaces?: string[]
) {
  const db = await instantiateDatabaseConnection(connectionConfig);
  return await getDatabaseObjects(db, namespaces);
}

export async function introspectDatabase(config: BloodhoundConfig) {
  const dbObjects = await fetchDatabaseObjects(
    config.connectionConfig,
    config.namespaces
  );

  const schema = buildSchema(dbObjects);

  return schema;
}
