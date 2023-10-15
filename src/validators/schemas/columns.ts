import { z } from 'zod';
import { constraintsQueryValidator } from './constraints';

export type ColumnQuery = z.infer<typeof columnsQueryValidator>;

export const columnsQueryValidator = z.object({
  name: z.string(),
  parentOid: z.number().int(),
  parentKind: z.string(),
  isNullable: z.boolean(),
  pgType: z.string(),
  dimensions: z.number().int().gte(0),
  defaultWithTypeCast: z.string().nullable(),
  description: z.string().nullable(),
  isGenerated: z.boolean(),
  constraints: z.array(constraintsQueryValidator).default([]),
});
