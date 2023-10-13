import type { ClientConfig } from 'pg';
import { instantiateDatabaseConnection, getDatabaseObjects } from '@/database';
import { buildSchema } from './utils/schemaBuilder';

async function fetchDatabaseObjects(connectionConfig: ClientConfig) {
  const db = await instantiateDatabaseConnection(connectionConfig);
  return await getDatabaseObjects(db);
}

export async function introspectDatabase(connectionConfig: ClientConfig) {
  const dbObjects = await fetchDatabaseObjects(connectionConfig);

  const schema = buildSchema(dbObjects);

  console.dir(schema, { depth: 10 });
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
