import type { RelationData, SchemaData } from '@/types';
import type {
  RelationQuery,
  NamespaceQuery,
  ColumnQuery,
  ConstraintQuery,
} from '@/validators';

function mapByParentOid<T extends { parentOid: number }>(
  items: T[]
): Map<number, T[]> {
  return items.reduce((map, item) => {
    if (map.has(item.parentOid)) {
      map.get(item.parentOid)!.push(item);
    } else {
      map.set(item.parentOid, [item]);
    }
    return map;
  }, new Map<number, T[]>());
}

function mapRelationOidToQueryResult(relations: RelationQuery[]) {
  return relations.reduce((map, relation) => {
    map.set(relation.oid, relation);
    return map;
  }, new Map<number, RelationQuery>());
}

function mapNamespaceNameToOid(namespaces: NamespaceQuery[]) {
  return namespaces.reduce((map, namespace) => {
    map.set(namespace.oid, namespace.name);
    return map;
  }, new Map<number, string>());
}

export function mapRelationsWithNestedColumnsAndConstraints(
  relations: RelationQuery[],
  columns: ColumnQuery[],
  constraints: ConstraintQuery[]
) {
  const columnMap = mapByParentOid(columns);
  const constraintMap = mapByParentOid(constraints);
  const relationMap = mapRelationOidToQueryResult(relations);

  const result: RelationData[] = [];

  for (const [relationOid, relation] of relationMap.entries()) {
    const relationColumns = columnMap.get(relationOid) ?? [];
    const relationConstraints = constraintMap.get(relationOid) ?? [];
    const relationData: RelationData = {
      columns: {},
      constraints: {},
      ...relation,
    };

    for (const column of relationColumns) {
      relationData.columns[column.name] = column;
    }

    for (const constraint of relationConstraints) {
      relationData.constraints[constraint.name] = constraint;
    }

    result.push(relationData);
  }

  return result;
}

const relationTypes = {
  r: 'tables',
  v: 'views',
  m: 'materializedViews',
} as const;

export function sortRelationsIntoNamespaces(
  relations: RelationData[],
  namespaces: NamespaceQuery[]
) {
  const namespaceMap = mapNamespaceNameToOid(namespaces);
  const result: Record<
    string,
    Pick<SchemaData, 'views' | 'materializedViews' | 'tables'>
  > = {};

  for (const name of namespaceMap.values()) {
    result[name] = { views: {}, materializedViews: {}, tables: {} };
  }

  for (const relation of relations) {
    const type = relationTypes[relation.kind as keyof typeof relationTypes];

    if (!type) {
      // TODO: errors
      console.warn(`Unknown PG Kind: ${relation.kind}`);
      continue;
    }

    const namespaceName = namespaceMap.get(relation.parentOid);
    if (!namespaceName) {
      // TODO: errors
      console.warn(`Unknown namespace for relation: ${relation.name}`);
      continue;
    }
    result[namespaceName]![type][relation.name] = relation;
  }

  return result;
}
