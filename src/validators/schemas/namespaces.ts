import { z } from 'zod';

export type NamespaceQuery = z.infer<typeof namespaceQueryValidator>;

export const namespaceQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
});
