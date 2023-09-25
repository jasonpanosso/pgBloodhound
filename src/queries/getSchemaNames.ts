import type { Client } from 'pg';

export default async function getSchemaNames(db: Client) {
  const getNamespacesQuery = `
    SELECT nspname FROM pg_catalog.pg_namespace 
    WHERE nspname != 'information_schema' 
    AND nspname NOT LIKE 'pg_%';`;
  const { rows } = await db.query(getNamespacesQuery);
  const schemas = rows
    .map((row: { nspname?: string }) => {
      if ('nspname' in row) {
        return row.nspname;
      }
    })
    .filter(
      (schema): schema is string => !!schema && typeof schema === 'string'
    );

  if (!schemas.length) {
    throw new Error(
      'Error introspecting database: No non-system schemas found'
    );
  }
  return schemas;
}
