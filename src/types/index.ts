import type { ColumnQuery, ConstraintQuery, EnumQuery } from '@/validators';

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

export type SchemaData = {
  tables: Record<string, RelationData>;
  views: Record<string, RelationData>;
  materializedViews: Record<string, RelationData>;
  enums: Record<string, EnumQuery>;
  domains: unknown;
  ranges: unknown;
  compositeTypes: unknown;
  functions: unknown;
};
