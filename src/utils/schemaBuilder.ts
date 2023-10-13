import type { RelationData, SchemaData } from '@/types';
import type {
  NamespaceQuery,
  EnumQuery,
  ConstraintQuery,
  ColumnQuery,
  RelationQuery,
} from '@/validators';
import { mapRelationsWithNestedColumnsAndConstraints } from './relationSchemaMappers';

type GroupingFunction<T extends { parentOid: number }> = (
  namespaceMap: Map<number, string>,
  items: T[],
  schema: Record<string, SchemaData>
) => void;

const curriedGroupByNamespace = (
  namespaceMap: Map<number, string>,
  schema: Record<string, SchemaData>
) => {
  return <T extends { parentOid: number }>(
    items: T[],
    grouper: GroupingFunction<T>
  ) => {
    grouper(namespaceMap, items, schema);
  };
};

const groupRelationsByNamespace: GroupingFunction<RelationData> = (
  namespaceMap,
  relations,
  schema
) => {
  const relationTypes = {
    r: 'tables',
    p: 'tables',
    v: 'views',
    m: 'materializedViews',
  } as const;

  for (const relation of relations) {
    const type = relationTypes[relation.kind];
    if (!type) {
      console.warn(`Unknown PG Kind: ${relation.kind}`);
      continue;
    }

    const namespaceName = namespaceMap.get(relation.parentOid);
    if (!namespaceName) {
      console.warn(`Unknown namespace for relation: ${relation.name}`);
      continue;
    }

    schema[namespaceName]![type][relation.name] = relation;
  }
};

const groupEnumsByNamespace: GroupingFunction<EnumQuery> = (
  namespaceMap,
  enums,
  schema
) => {
  for (const e of enums) {
    const namespaceName = namespaceMap.get(e.parentOid);
    if (!namespaceName) {
      console.warn(`Unknown namespace for enum: ${e.name}`);
      continue;
    }

    schema[namespaceName]!.enums[e.name] = e;
  }
};

function mapNamespaceNameToOid(namespaces: NamespaceQuery[]) {
  return namespaces.reduce((map, namespace) => {
    map.set(namespace.oid, namespace.name);
    return map;
  }, new Map<number, string>());
}

// TODO: replace all args with single dbObjects arg
export function buildSchema(
  relations: RelationQuery[],
  columns: ColumnQuery[],
  constraints: ConstraintQuery[],
  enums: EnumQuery[],
  namespaces: NamespaceQuery[]
) {
  const namespaceMap = mapNamespaceNameToOid(namespaces);

  const schema: Record<string, SchemaData> = {};

  for (const name of namespaceMap.values()) {
    schema[name] = {
      views: {},
      materializedViews: {},
      tables: {},
      enums: {},
      domains: {},
      ranges: {},
      compositeTypes: {},
      functions: {},
    };
  }

  const mappedRelations = mapRelationsWithNestedColumnsAndConstraints(
    relations,
    columns,
    constraints
  );

  const groupByNamespace = curriedGroupByNamespace(namespaceMap, schema);

  groupByNamespace(mappedRelations, groupRelationsByNamespace);
  groupByNamespace(enums, groupEnumsByNamespace);

  return schema;
}
