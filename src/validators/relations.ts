import { z } from 'zod';

const relationsQueryValidator = z.array(
  z.object({
    oid: z.number().int(),
    parentOid: z.number().int(),
    kind: z.string(),
    name: z.string(),
    description: z.string().nullable(),
  })
);

export function validateRelationsQuery(queryResult: unknown[]) {
  return relationsQueryValidator.parse(queryResult);
}
