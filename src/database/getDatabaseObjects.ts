import type { Client } from 'pg';
import type { DatabaseObjects } from '@/types';
import { executeSqlFile } from '@/database';
import { SqlFileName } from './sqlHelpers';
import {
  validateColumnsQuery,
  validateCompositeTypesQuery,
  validateConstraintsQuery,
  validateDomainsQuery,
  validateEnumsQuery,
  validateNamespacesQuery,
  validateRangesQuery,
  validateRelationsQuery,
  validateRoutinesQuery,
} from '@/validators';

async function getAndValidate<T>(
  db: Client,
  sqlFileName: SqlFileName,
  queryValidator: (queryResult: unknown[]) => T,
  namespaceOids?: number[]
): Promise<T> {
  const queryResult = await executeSqlFile(db, sqlFileName, namespaceOids);
  return queryValidator(queryResult);
}

export async function getDatabaseObjects(
  db: Client,
  includedNamespaces?: string[]
): Promise<DatabaseObjects> {
  try {
    await db.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY');

    const namespaces = await getAndValidate(
      db,
      SqlFileName.Namespaces,
      validateNamespacesQuery
    );

    if (namespaces.length === 0) {
      throw new Error('No namespaces found in database');
    }

    const filteredNamespaces = includedNamespaces
      ? namespaces.filter((ns) => includedNamespaces.includes(ns.name))
      : namespaces;
    const namespaceOids = filteredNamespaces.map((ns) => ns.oid);

    const relations = await getAndValidate(
      db,
      SqlFileName.Relations,
      validateRelationsQuery,
      namespaceOids
    );

    const columns = await getAndValidate(
      db,
      SqlFileName.Columns,
      validateColumnsQuery,
      namespaceOids
    );

    const constraints = await getAndValidate(
      db,
      SqlFileName.Constraints,
      validateConstraintsQuery,
      namespaceOids
    );

    const enums = await getAndValidate(
      db,
      SqlFileName.Enums,
      validateEnumsQuery,
      namespaceOids
    );

    const domains = await getAndValidate(
      db,
      SqlFileName.Domains,
      validateDomainsQuery,
      namespaceOids
    );

    const ranges = await getAndValidate(
      db,
      SqlFileName.Ranges,
      validateRangesQuery,
      namespaceOids
    );

    const compositeTypes = await getAndValidate(
      db,
      SqlFileName.CompositeTypes,
      validateCompositeTypesQuery,
      namespaceOids
    );

    const routines = await getAndValidate(
      db,
      SqlFileName.Routines,
      validateRoutinesQuery,
      namespaceOids
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
      routines,
    };
  } catch (err) {
    // TODO
    throw err;
  } finally {
    await db.query('ROLLBACK'); // assure no changes to the database
    await db.end();
  }
}
