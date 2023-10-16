import { z } from 'zod';
import { relationKind } from './common';

export type RelationQuery = z.infer<typeof relationsQueryValidator>;

export const relationsQueryValidator = z.object({
  oid: z.number().int(),
  parentOid: z.number().int(),
  kind: relationKind,
  name: z.string(),
  description: z.string().nullable(),
});
