import { z } from 'zod';

const columnsQueryValidator = z.array(
  z.object({
    name: z.string(),
    oid: z.number().int(),
    parentOid: z.number().int(),
    parentKind: z.string(),
    notNull: z.boolean(),
    sqlType: z.string(),
    dimensions: z.number().int().gte(0),
    defaultWithTypeCast: z.string().nullable(),
    description: z.string().nullable(),
    isGenerated: z.boolean(),
  })
);

export function validateColumnsQuery(queryResult: unknown[]) {
  return columnsQueryValidator.parse(queryResult);
}
