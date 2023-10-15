import type { RelationData } from '@/types';
import type { RelationQuery, ColumnQuery, ConstraintQuery } from '@/validators';

function groupItemsByParentOid<
  T extends RelationQuery | ColumnQuery | ConstraintQuery,
>(items: T[]): Map<number, T[]> {
  return items.reduce((map, item) => {
    if (map.has(item.parentOid)) {
      map.get(item.parentOid)!.push(item);
    } else {
      map.set(item.parentOid, [item]);
    }
    return map;
  }, new Map<number, T[]>());
}

function createRelationOidToQueryMap(relations: RelationQuery[]) {
  return relations.reduce((map, relation) => {
    map.set(relation.oid, relation);
    return map;
  }, new Map<number, RelationQuery>());
}

export function sortRelationsByType(relationData: RelationData[]) {
  const relationKindToTypeMap = {
    r: 'tables',
    p: 'tables',
    v: 'views',
    m: 'materializedViews',
  } as const;

  const sortedRelations: {
    tables: RelationData[];
    views: RelationData[];
    materializedViews: RelationData[];
  } = {
    tables: [],
    views: [],
    materializedViews: [],
  };

  for (const relation of relationData) {
    const type = relationKindToTypeMap[relation.kind];
    if (!type) {
      console.warn(
        `Encountered unknown PG Kind while sorting relations: ${relation.kind}`
      );
      continue;
    }

    sortedRelations[type].push(relation);
  }

  return sortedRelations;
}

export function nestColumnsAndConstraintsInRelations(
  relations: RelationQuery[],
  columns: ColumnQuery[],
  constraints: ConstraintQuery[]
) {
  const columnMap = groupItemsByParentOid(columns);
  const constraintMap = groupItemsByParentOid(constraints);
  const relationMap = createRelationOidToQueryMap(relations);

  const nestedRelations: RelationData[] = [];

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

      if (constraint.columnNames) {
        for (const columnName of constraint.columnNames) {
          const column = relationData.columns[columnName];
          if (column) {
            column.constraints.push(constraint);
          } else {
            console.warn(
              `Column ${columnName} not found in relation ${relation.name}`
            );
          }
        }
      }
    }

    nestedRelations.push(relationData);
  }

  return nestedRelations;
}
