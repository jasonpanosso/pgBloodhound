import { Client, type ClientConfig } from 'pg';

export async function instantiateDatabaseConnection(config: ClientConfig) {
  const client = new Client(config);
  try {
    await client.connect();
    return client;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Error connecting to database: ${err.message}`);
    } else {
      throw new Error(
        `An unknown error occurred while connecting to the database: ${String(
          err
        )}`
      );
    }
  }
}
