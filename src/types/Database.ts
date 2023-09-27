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

export const COLUMN_GENERATED = ['ALWAYS', 'BY DEFAULT', 'NEVER'] as const;

export type ColumnGenerated = (typeof COLUMN_GENERATED)[number];

export const CONSTRAINT_TYPE = [
  'PRIMARY_KEY',
  'FOREIGN_KEY',
  'CHECK',
  'UNIQUE',
  'TRIGGER',
  'EXCLUSION',
] as const;

export interface DatabaseObject {
  objectName: string;
  schema: string;
  objectType: DatabaseObjectType;
  description: string | null;
}

export type ConstraintType = (typeof CONSTRAINT_TYPE)[number];

export type ColumnConstraint = {
  checkCondition: string | null;
  constraintType: ConstraintType;
  foreignKeyReferences:
    | { schema: string; table: string; column: string }[]
    | null;
};

export type SchemaDetails = {
  tables: Record<string, TableDetails>;
  views: Record<string, ViewDetails>;
  materializedViews: Record<string, ViewDetails>;
  enums: Record<string, string[]>;
  ranges: unknown;
  domains: Record<string, DomainDetails>;
  compositeTypes: Record<string, Record<string, CompositeTypeDetails>>;
};

export interface DomainDetails {
  pgType: string;
  defaultValue: string | null;
  constraints: Record<string, string>;
}

// TODO: how tf do ranges work?
export interface RangeDetails {
  subtype: string;
  collation: string;
  canonicalFunction: string;
  subtypeDiffFunction: string;
}

export interface CompositeTypeDetails {
  pgType: string;
  isNullable: boolean;
  isArray: boolean;
  dimensions: number;
  typeDetails: string;
  typeCategory: string;
}

export interface ViewDetails {
  columns: Record<string, ColumnDetails | undefined>;
  // triggers: unknown;
  // constraints: unknown;
}

export interface TableDetails {
  columns: Record<string, ColumnDetails | undefined>;
  // triggers: unknown;
  // constraints: unknown;
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
  constraints: Record<string, ColumnConstraint> | null;
}
