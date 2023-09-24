import { Client } from 'pg';
import getSchemaNames from './queries/getSchemaNames';
import getDatabaseObjectsFromSchema from './queries/getDatabaseObjects';
import introspectSchemaTables from './queries/introspectSchemaTables';
import type { DatabaseObject } from './types/Database';

// testing
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 54322,
});

const connectToDatabase = async () => {
  try {
    await client.connect();

    const { rows } = await getSchemaNames(client);
    const schemas = rows
      .map((row: { nspname?: string }) => {
        if ('nspname' in row) {
          return row.nspname;
        }
      })
      .filter((item): item is string => item !== undefined);

    if (!schemas.length) {
      throw new Error(
        'Error introspecting database: No non-system schemas found'
      );
    }
    console.log('Data:', schemas);

    const objects = await getDatabaseObjectsFromSchema(client, ['public']);
    const tableSchemas = await introspectSchemaTables(
      client,
      objects.filter(
        (obj): obj is DatabaseObject & { objectType: 'table' } =>
          obj.objectType === 'table'
      )
    );

    console.dir(tableSchemas, { depth: 7 });
  } catch (err) {
    console.error('Database connection error', err);
  } finally {
    await client.end();
  }
};

void connectToDatabase();
