import { z } from 'zod';

export type CollationQuery = z.infer<typeof collationsQueryValidator>;

export const collationsQueryValidator = z.object({
  name: z.string(),
  oid: z.string(),
  encoding: z.number(),
  collate: z.string().nullable(),
  cType: z.string().nullable(),
});
