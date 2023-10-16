import { z } from 'zod';
import { constraintType } from './common';

export type ConstraintQuery = z.infer<typeof constraintsQueryValidator>;

export const constraintsQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
  parentOid: z.number().int(),
  parentKind: z.string(),
  constraintType: constraintType,
  onUpdate: z.string().nullable(),
  onDelete: z.string().nullable(),
  matchType: z.string().nullable(),
  description: z.string().nullable(),
  isValidated: z.boolean(),
  isDeferrable: z.boolean(),
  isDeferred: z.boolean(),
  columnNames: z.array(z.string()),
  definition: z.string(),
  indexOid: z.number().nullable(),
  references: z
    .array(
      z.object({
        namespaceOid: z.string(),
        tableOid: z.string(),
        columnName: z.string(),
        columnAttNum: z.number().int(),
        dataType: z.string(),
      })
    )
    .nullable(),
});
