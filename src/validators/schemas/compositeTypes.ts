import { z } from 'zod';

export type CompositeTypeQuery = z.infer<typeof compositeTypeQueryValidator>;

export const compositeTypeQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
  parentOid: z.number().int(),
  fields: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      isArray: z.boolean(),
      dimensions: z.number().int(),
      typeCategory: z.string(),
    })
  ),
});
