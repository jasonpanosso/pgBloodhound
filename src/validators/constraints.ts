import { z } from 'zod';

const constraintsQueryValidator = z.array(
  z.object({
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
    columnNames: z.string(),
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
  })
);

export function validateConstraintsQuery(queryResult: unknown[]) {
  return constraintsQueryValidator.parse(queryResult);
}
