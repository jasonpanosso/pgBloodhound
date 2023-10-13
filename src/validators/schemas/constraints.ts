import { z } from 'zod';

export type ConstraintQuery = z.infer<typeof constraintsQueryValidator>;

export const constraintsQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
  parentOid: z.number().int(),
  parentKind: z.string(),
  type: z.string(),
  onUpdate: z.string(),
  onDelete: z.string(),
  matchType: z.string(),
  isDeferrable: z.boolean(),
  isDeferred: z.boolean(),
  columnNames: z.array(z.string()), // TODO: test if nullable
  definition: z.string(),
  references: z
    .array(
      z.object({
        columnName: z.string(),
        namespaceOid: z.string(),
        tableOid: z.string(),
        columnAttNum: z.number().int(),
      })
    )
    .nullable(),
});
