import type { RelationData } from '@/types';
import type { RelationQuery, ColumnQuery, ConstraintQuery } from '@/validators';

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
