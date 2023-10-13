import { z } from 'zod';

export type NamespaceQuery = z.infer<typeof namespacesQueryValidator>;

export const namespacesQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
});
