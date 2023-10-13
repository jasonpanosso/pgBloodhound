import { z } from 'zod';

export type RangeQuery = z.infer<typeof rangesQueryValidator>;

export const rangesQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
  parentOid: z.number().int(),
  canonicalFunction: z.string(),
  subtypeDiffFunction: z.string(),
  subtype: z.string(),
  rangeCollation: z.string(),
});
