import type {
  ColumnQuery,
  CompositeTypeQuery,
  ConstraintQuery,
  DomainQuery,
  EnumQuery,
  NamespaceQuery,
  RangeQuery,
  RelationQuery,
} from '@/validators';

export type DatabaseObjects = {
  namespaces: NamespaceQuery[];
  relations: RelationQuery[];
  columns: ColumnQuery[];
  constraints: ConstraintQuery[];
  enums: EnumQuery[];
  domains: DomainQuery[];
  ranges: RangeQuery[];
  compositeTypes: CompositeTypeQuery[];
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

// TODO: indexes, functions
export type NamespaceData = {
  tables: Record<string, RelationData>;
  views: Record<string, RelationData>;
  materializedViews: Record<string, RelationData>;
  enums: Record<string, EnumQuery>;
  domains: Record<string, DomainQuery>;
  ranges: Record<string, RangeQuery>;
  compositeTypes: Record<string, CompositeTypeQuery>;
};

export type Schema = Record<string, NamespaceData>;
