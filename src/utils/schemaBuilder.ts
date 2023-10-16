import type { DatabaseObjects, Schema, NamespaceData } from '@/types';
import type { NamespaceQuery } from '@/validators';
import {
  nestColumnsAndConstraintsInRelations,
  sortRelationsByType,
} from './relationDataTransformers';

type UnwrappedRecord<T> = T extends Record<string, infer U> ? U : never;

const curriedPopulateSchemaByNamespace = (
  namespaceMap: Map<number, string>,
  schema: Schema
) => {
  return <
    T extends UnwrappedRecord<NamespaceData[K]>,
    K extends keyof NamespaceData,
  >(
    dbObjects: T[],
    objectType: K
  ) => {
    populateSchemaByNamespace(namespaceMap, dbObjects, objectType, schema);
  };
};

function populateSchemaByNamespace<
  T extends UnwrappedRecord<NamespaceData[K]>,
  K extends keyof NamespaceData,
>(
  namespaceMap: Map<number, string>,
  databaseObjects: T[],
  objectType: K,
  schema: Schema
) {
  for (const databaseObject of databaseObjects) {
    const namespaceName = namespaceMap.get(databaseObject.parentOid);
    if (!namespaceName) {
      console.warn(
        `Unknown namespace for database object: ${databaseObject.name}`
      );
      continue;
    }

    schema[namespaceName]![objectType][databaseObject.name] = databaseObject;
  }
}

function createNamespaceNameToOidMap(namespaces: NamespaceQuery[]) {
  return namespaces.reduce((map, namespace) => {
    map.set(namespace.oid, namespace.name);
    return map;
  }, new Map<number, string>());
}

export function buildSchema(dbObjects: DatabaseObjects): Schema {
  const {
    namespaces,
    relations,
    columns,
    constraints,
    enums,
    ranges,
    domains,
    compositeTypes,
  } = dbObjects;

  const namespaceMap = createNamespaceNameToOidMap(namespaces);

  const schema: Schema = {};

  for (const name of namespaceMap.values()) {
    schema[name] = {
      views: {},
      materializedViews: {},
      tables: {},
      enums: {},
      domains: {},
      ranges: {},
      compositeTypes: {},
    };
  }

  const mappedRelations = nestColumnsAndConstraintsInRelations(
    relations,
    columns,
    constraints
  );

  const { tables, views, materializedViews } =
    sortRelationsByType(mappedRelations);

  const populateSchema = curriedPopulateSchemaByNamespace(namespaceMap, schema);

  populateSchema(tables, 'tables');
  populateSchema(views, 'views');
  populateSchema(materializedViews, 'materializedViews');
  populateSchema(enums, 'enums');
  populateSchema(domains, 'domains');
  populateSchema(ranges, 'ranges');
  populateSchema(compositeTypes, 'compositeTypes');

  return schema;
}
