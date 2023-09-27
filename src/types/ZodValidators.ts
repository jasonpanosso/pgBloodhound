import { z } from 'zod';
import {
  COLUMN_GENERATED,
  CONSTRAINT_TYPE,
  type ColumnDetails,
  type ColumnConstraint,
  type TableDetails,
  type CompositeTypeDetails,
} from './Database';

export type toZod<T> = z.ZodObject<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]: z.ZodType<T[K], any>;
}>;

export const columnConstraitsValidator: toZod<ColumnConstraint> = z.object({
  checkCondition: z.string().nullable(),
  constraintType: z.enum(CONSTRAINT_TYPE),
  foreignKeyReferences: z
    .array(
      z.object({ table: z.string(), column: z.string(), schema: z.string() })
    )
    .nullable(),
});

export const columnsValidator: toZod<ColumnDetails> = z.object({
  pgType: z.string(),
  isArray: z.boolean(),
  generated: z.enum(COLUMN_GENERATED),
  dimensions: z.number(),
  isIdentity: z.boolean(),
  isNullable: z.boolean(),
  typeDetails: z.string(),
  typeCategory: z.string(),
  constraints: z.record(columnConstraitsValidator).nullable(),
  charMaxLength: z.number().nullable(),
  numericPrecision: z.number().nullable(),
  columnDefault: z.string().nullable(),
});

export const tableValidator: toZod<TableDetails> = z.object({
  columns: z.record(columnsValidator.optional()),
});

export const compositeTypeValidator: toZod<CompositeTypeDetails> = z.object({
  pgType: z.string(),
  isNullable: z.boolean(),
  isArray: z.boolean(),
  dimensions: z.number(),
  typeCategory: z.string(),
  typeDetails: z.string(),
});
