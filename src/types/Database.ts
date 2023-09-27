export const DATABASE_OBJECT_TYPES = [
  'table',
  'view',
  'materializedView',
  'compositeType',
  'domain',
  'enum',
  'range',
] as const;

export type DatabaseObjectType = (typeof DATABASE_OBJECT_TYPES)[number];

export interface DatabaseObject {
  objectName: string;
  schema: string;
  objectType: DatabaseObjectType;
  description: string | null;
}

export type ColumnGenerated = 'ALWAYS' | 'BY DEFAULT' | 'NEVER';

export type Constraint = {
  checkCondition: string | null;
  constraintType: ConstraintType;
  foreignKeyReferences:
    | { schema: string; table: string; column: string }[]
    | null;
};

export type ConstraintType =
  | 'PRIMARY_KEY'
  | 'FOREIGN_KEY'
  | 'CHECK'
  | 'UNIQUE'
  | 'TRIGGER'
  | 'EXCLUSION';

export type SchemaDetails = {
  tables: Record<string, TableDetails>;
  views: Record<string, TableDetails>;
  materializedViews: Record<string, TableDetails>;
  enums: Record<string, string[]>;
  ranges: unknown;
  domains: DomainDetails;
  compositeTypes: CompositeTypeDetails;
};

export interface DomainDetails {
  pgType: string;
  defaultValue: string | null;
  constraints: Record<string, string>;
}

export interface CompositeTypeDetails {
  pgType: string;
  isNullable: boolean;
  isArray: boolean;
  dimensions: number;
  typeDetails: string;
  typeCategory: string;
}

export interface TableDetails {
  columns: Record<string, ColumnDetails>;
  triggers: unknown;
  constraints: unknown;
}

export interface ColumnDetails {
  pgType: string;
  columnDefault: string | null;
  charMaxLength: number | null;
  numericPrecision: number | null;
  typeDetails: string;
  typeCategory: string;
  generated: ColumnGenerated;
  isNullable: boolean;
  isIdentity: boolean;
  isArray: boolean;
  dimensions: number;
  constraints: Record<string, Constraint>;
}
