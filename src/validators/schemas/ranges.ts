import { z } from 'zod';
import { collationsQueryValidator } from './collations';

export type RangeQuery = z.infer<typeof rangesQueryValidator>;

export const rangesQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
  parentOid: z.number().int(),
  description: z.string().nullable(),
  canonicalFunction: z.string().nullable(),
  subtypeDiffFunction: z.string().nullable(),
  subtype: z.string(),
  collation: collationsQueryValidator.nullable(),
});
