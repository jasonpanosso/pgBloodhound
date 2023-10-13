import { z } from 'zod';

export type EnumQuery = z.infer<typeof enumsQueryValidator>;

export const enumsQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
  parentOid: z.number().int(),
  values: z.array(z.string()),
});
