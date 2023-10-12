import type { ColumnQuery, ConstraintQuery } from '@/validators';

// TODO: TEMP types for testing
export type RelationData = {
  name: string;
  oid: number;
  parentOid: number;
  description: string | null;
  kind: string;
  columns: Record<string, ColumnQuery>;
  constraints: Record<string, ConstraintQuery>;
};

export type SchemaData = {
  tables: Record<string, RelationData>;
  views: Record<string, RelationData>;
  materializedViews: Record<string, RelationData>;
  enums: unknown;
  domains: unknown;
  ranges: unknown;
  compositeTypes: unknown;
  functions: unknown;
};
