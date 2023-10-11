import { z } from 'zod';

export type ColumnQuery = z.infer<typeof columnsQueryValidator>;

const columnsQueryValidator = z.object({
  name: z.string(),
  parentOid: z.number().int(),
  parentKind: z.string(),
  notNull: z.boolean(),
  sqlType: z.string(),
  dimensions: z.number().int().gte(0),
  defaultWithTypeCast: z.string().nullable(),
  description: z.string().nullable(),
  isGenerated: z.boolean(),
});

export function validateColumnsQuery(queryResult: unknown[]) {
  return z.array(columnsQueryValidator).parse(queryResult);
}
