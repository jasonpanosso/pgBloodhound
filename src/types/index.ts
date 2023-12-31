import type {
  ColumnQuery,
  CompositeTypeQuery,
  ConstraintQuery,
  DomainQuery,
  EnumQuery,
  NamespaceQuery,
  RangeQuery,
  RelationQuery,
  RoutineQuery,
} from '@/validators';

export type { BloodhoundConfig } from './config';

export type DatabaseObjects = {
  namespaces: NamespaceQuery[];
  relations: RelationQuery[];
  columns: ColumnQuery[];
  constraints: ConstraintQuery[];
  enums: EnumQuery[];
  domains: DomainQuery[];
  ranges: RangeQuery[];
  compositeTypes: CompositeTypeQuery[];
  routines: RoutineQuery[];
};

// TODO: TEMP types for testing
export type RelationData = {
  name: string;
  oid: number;
  parentOid: number;
  description: string | null;
  kind: 'r' | 'm' | 'v' | 'p';
  columns: Record<string, ColumnQuery>;
  constraints: Record<string, ConstraintQuery>;
};

// TODO: indices, functions, triggers, sequences, collations?
export type NamespaceData = {
  tables: Record<string, RelationData>;
  views: Record<string, RelationData>;
  materializedViews: Record<string, RelationData>;
  enums: Record<string, EnumQuery>;
  domains: Record<string, DomainQuery>;
  ranges: Record<string, RangeQuery>;
  compositeTypes: Record<string, CompositeTypeQuery>;
  routines: Record<string, RoutineQuery>;
};

export type Schema = Record<string, NamespaceData>;
