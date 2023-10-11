import type { ClientConfig } from 'pg';
import {
  validateNamespacesQuery,
  validateRelationsQuery,
  validateColumnsQuery,
  validateConstraintsQuery,
  type NamespaceQuery,
  type RelationQuery,
  type ColumnQuery,
  type ConstraintQuery,
} from './validators';
import instantiateDatabaseConnection from '@/database';
import { executeSqlFile } from './utils/sqlHelpers';
import assert from 'assert';

const introspectDatabase = async (connectionConfig: ClientConfig) => {
  const db = await instantiateDatabaseConnection(connectionConfig);
  try {
    await db.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    const namespaceQueryResult = await executeSqlFile(db, 'namespaces');
    const namespaces = validateNamespacesQuery(namespaceQueryResult);
    assert(namespaces.length > 0, 'No namespaces found in database');

    const namespaceOids = namespaces.map((ns) => ns.oid);

    const relationsQueryResult = await executeSqlFile(
      db,
      'relations',
      namespaceOids
    );
    const relations = validateRelationsQuery(relationsQueryResult);

    // console.dir(relations, { depth: 7 });
    const columnsQueryResult = await executeSqlFile(
      db,
      'columns',
      namespaceOids
    );
    const columns = validateColumnsQuery(columnsQueryResult);

    // console.dir(columns, { depth: 7 });
    const constraintsQueryResult = await executeSqlFile(
      db,
      'constraints',
      namespaceOids
    );
    const constraints = validateConstraintsQuery(constraintsQueryResult);

    // console.dir(constraints, { depth: 7 });

    const test = nestAndSortData(namespaces, relations, columns, constraints);

    console.dir(test, { depth: 7 });
  } catch (err) {
    throw err;
  } finally {
    await db.query('ROLLBACK'); // assure no changes to the database
    await db.end();
  }
};

function sortColumnsByParentOid(columns: ColumnQuery[]) {
  return columns.reduce((map, column) => {
    if (map.has(column.parentOid)) {
      map.get(column.parentOid)!.push(column);
    } else {
      map.set(column.parentOid, [column]);
    }
    return map;
  }, new Map<number, ColumnQuery[]>());
}

function sortConstraintsByParentOid(constraints: ConstraintQuery[]) {
  return constraints.reduce((map, constraint) => {
    if (map.has(constraint.parentOid)) {
      map.get(constraint.parentOid)!.push(constraint);
    } else {
      map.set(constraint.parentOid, [constraint]);
    }
    return map;
  }, new Map<number, ConstraintQuery[]>());
}

function createRelationsMap(relations: RelationQuery[]) {
  return relations.reduce((map, relation) => {
    map.set(relation.oid, relation);
    return map;
  }, new Map<number, RelationQuery>());
}

function createNamespacesMap(namespaces: NamespaceQuery[]) {
  return namespaces.reduce((map, namespace) => {
    map.set(namespace.oid, namespace);
    return map;
  }, new Map<number, NamespaceQuery>());
}

// TODO: TEMP types for testing
type ColumnData = ColumnQuery;
type ConstraintData = ConstraintQuery;

type RelationData = {
  columns: Record<string, ColumnData>;
  constraints: Record<string, ConstraintData>;
};

type SchemaData = {
  tables: Record<string, RelationData>;
};

type Schema = Record<string, SchemaData>;

function nestAndSortData(
  namespaces: NamespaceQuery[],
  relations: RelationQuery[],
  columns: ColumnQuery[],
  constraints: ConstraintQuery[]
): Schema {
  const columnMap = sortColumnsByParentOid(columns);
  const constraintMap = sortConstraintsByParentOid(constraints);
  const relationMap = createRelationsMap(relations);
  const namespaceMap = createNamespacesMap(namespaces);

  const result: Schema = {};

  for (const [namespaceOid, namespace] of namespaceMap.entries()) {
    result[namespace.name] = { tables: {} };

    for (const [relationOid, relation] of relationMap.entries()) {
      if (relation.parentOid === namespaceOid) {
        const relationColumns = columnMap.get(relationOid) ?? [];
        const relationConstraints = constraintMap.get(relationOid) ?? [];
        const relationData: RelationData = { columns: {}, constraints: {} };

        for (const column of relationColumns) {
          relationData.columns[column.name] = column;
        }

        for (const constraint of relationConstraints) {
          relationData.constraints[constraint.name] = constraint;
        }

        result[namespace.name]!.tables[relation.name] = relationData;
      }
    }
  }

  return result;
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
