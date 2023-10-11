import { z } from 'zod';

export type NamespaceQuery = z.infer<typeof namespaceQueryValidator>;

const namespaceQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
});

export function validateNamespacesQuery(queryResult: unknown[]) {
  return z.array(namespaceQueryValidator).parse(queryResult);
}
