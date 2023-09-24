export interface DatabaseObject {
  objectName: string;
  schema: string;
  objectType: string;
  description: string | null;
}

export interface SchemaDetails {
  schema: string;
  tables: TableDetails;
}

export type TableDetails = Record<string, ColumnDetails[]>;

export type ColumnGenerated = 'ALWAYS' | 'BY DEFAULT' | 'NEVER';

export interface ColumnDetails {
  columnName: string;
  pgType: string;
  columnDefault: string | null;
  charMaxLength: number | null;
  numericPrecision: number | null;
  typeDetails: string;
  typeCategory: string;
  generated: ColumnGenerated;
  isNullable: boolean;
  isIdentity: boolean;
  isUpdateable: boolean;
  isArray: boolean;
  constrants: { constraintType: string; foreignReference: string }[] | null;
}
