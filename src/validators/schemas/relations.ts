import { z } from 'zod';

export type RelationQuery = z.infer<typeof relationsQueryValidator>;

export const relationsQueryValidator = z.object({
  oid: z.number().int(),
  parentOid: z.number().int(),
  kind: z.string(),
  name: z.string(),
  description: z.string().nullable(),
});
