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

export interface SchemaDetails {
  schema: string;
  tables: TableDetails;
}

export type TableDetails = Record<string, ColumnDetails[]>;

export type ColumnGenerated = 'ALWAYS' | 'BY DEFAULT' | 'NEVER';

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
  constrants: { constraintType: string; foreignReference: string }[] | null;
}
