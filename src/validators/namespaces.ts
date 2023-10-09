import { z } from 'zod';

const namespaceQueryValidator = z.array(
  z.object({ name: z.string(), oid: z.number().int() })
);

export function validateNamespacesQuery(queryResult: unknown[]) {
  return namespaceQueryValidator.parse(queryResult);
}
