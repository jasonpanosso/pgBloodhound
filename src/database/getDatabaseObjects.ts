import type { Client } from 'pg';
import { executeSqlFile } from '@/database';
import {
  validateColumnsQuery,
  validateConstraintsQuery,
  validateEnumsQuery,
  validateNamespacesQuery,
  validateRelationsQuery,
} from '@/validators';

export async function getDatabaseObjects(db: Client) {
  try {
    await db.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    const namespaceQueryResult = await executeSqlFile(db, 'namespaces');
    const namespaces = validateNamespacesQuery(namespaceQueryResult);
    if (namespaces.length === 0) {
      throw new Error('No namespaces found in database');
    }

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

    const enumsQueryResult = await executeSqlFile(db, 'enums', namespaceOids);
    const enums = validateEnumsQuery(enumsQueryResult);

    return { namespaces, relations, columns, constraints, enums };
  } catch (err) {
    // TODO
    throw err;
  } finally {
    await db.query('ROLLBACK'); // assure no changes to the database
    await db.end();
  }
}
