import { z } from 'zod';
import { constraintsQueryValidator } from './constraints';
import { generationMethod, relationKind } from './common';

export type ColumnQuery = z.infer<typeof columnsQueryValidator>;

export const columnsQueryValidator = z.object({
  name: z.string(),
  attNum: z.number().int(),
  parentOid: z.number().int(),
  parentKind: relationKind,
  isNullable: z.boolean(),
  isIdentity: z.boolean(),
  dataType: z.string(),
  dimensions: z.number().int().gte(0),
  defaultValue: z.string().nullable(),
  generationMethod: generationMethod.nullable(),
  description: z.string().nullable(),
  isGenerated: z.boolean(),
  constraints: z.array(constraintsQueryValidator).default([]),
});
