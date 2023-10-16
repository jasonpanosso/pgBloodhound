import { z } from 'zod';
import { pgTypeCategories } from './common';

export type CompositeTypeQuery = z.infer<typeof compositeTypeQueryValidator>;

const field = z.object({
  name: z.string(),
  dataType: z.string(),
  isArray: z.boolean(),
  dimensions: z.number().int(),
  typeCategory: pgTypeCategories,
  domainBaseType: z.string().nullable(),
});

export const compositeTypeQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
  parentOid: z.number().int(),
  fields: z.array(field).transform((fields) =>
    fields.reduce((acc: Record<string, z.infer<typeof field>>, cur) => {
      acc[cur.name] = cur;
      return acc;
    }, {})
  ),
});
