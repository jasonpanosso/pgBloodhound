import type { Client } from 'pg';
import type { DatabaseObjects } from '@/types';
import { executeSqlFile } from '@/database';
import {
  validateColumnsQuery,
  validateCompositeTypesQuery,
  validateConstraintsQuery,
  validateDomainsQuery,
  validateEnumsQuery,
  validateNamespacesQuery,
  validateRangesQuery,
  validateRelationsQuery,
} from '@/validators';

export async function getDatabaseObjects(
  db: Client,
  includedNamespaces?: string[]
): Promise<DatabaseObjects> {
  try {
    await db.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    const namespaceQueryResult = await executeSqlFile(db, 'namespaces');
    const namespaces = validateNamespacesQuery(namespaceQueryResult);
    if (namespaces.length === 0) {
      throw new Error('No namespaces found in database');
    }

    const filteredNamespaces = includedNamespaces
      ? namespaces.filter((ns) => includedNamespaces.includes(ns.name))
      : namespaces;

    const namespaceOids = filteredNamespaces.map((ns) => ns.oid);

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

    const domainsQueryResult = await executeSqlFile(
      db,
      'domains',
      namespaceOids
    );
    const domains = validateDomainsQuery(domainsQueryResult);

    const rangesQueryResult = await executeSqlFile(db, 'ranges', namespaceOids);
    const ranges = validateRangesQuery(rangesQueryResult);

    const compositeTypesQueryResult = await executeSqlFile(
      db,
      'compositeTypes',
      namespaceOids
    );
    const compositeTypes = validateCompositeTypesQuery(
      compositeTypesQueryResult
    );

    return {
      namespaces: filteredNamespaces,
      relations,
      columns,
      constraints,
      enums,
      domains,
      ranges,
      compositeTypes,
    };
  } catch (err) {
    // TODO
    throw err;
  } finally {
    await db.query('ROLLBACK'); // assure no changes to the database
    await db.end();
  }
}
