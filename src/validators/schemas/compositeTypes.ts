import { z } from 'zod';

export type CompositeTypeQuery = z.infer<typeof compositeTypeQueryValidator>;

const fieldValidator = z.object({
  name: z.string(),
  type: z.string(),
  isArray: z.boolean(),
  dimensions: z.number().int(),
  typeCategory: z.string(),
});

export const compositeTypeQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
  parentOid: z.number().int(),
  fields: z.array(fieldValidator).transform((fields) =>
    fields.reduce(
      (acc: Record<string, z.infer<typeof fieldValidator>>, cur) => {
        acc[cur.name] = cur;
        return acc;
      },
      {}
    )
  ),
});
