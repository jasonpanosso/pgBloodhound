import type { Client } from 'pg';

export default async function getSchemaNames(db: Client) {
  const getNamespacesQuery = `
    SELECT nspname FROM pg_catalog.pg_namespace 
    WHERE nspname != 'information_schema' 
    AND nspname NOT LIKE 'pg_%';`;
  return await db.query(getNamespacesQuery);
}
