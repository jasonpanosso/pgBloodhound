import { z } from 'zod';

export type ConstraintQuery = z.infer<typeof constraintsQueryValidator>;

export const constraintsQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
  parentOid: z.number().int(),
  parentKind: z.string(),
  type: z.string(),
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
        columnType: z.string(),
      })
    )
    .nullable(),
});
