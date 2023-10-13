import { z } from 'zod';

export type DomainQuery = z.infer<typeof domainsQueryValidator>;

export const domainsQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
  parentOid: z.number().int(),
  defaultValue: z.string().nullable(),
  type: z.string(),
});
