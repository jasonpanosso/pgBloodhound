import { z } from 'zod';

export type RoutineQuery = z.infer<typeof routinesQueryValidator>;

export const routinesQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
  type: z.string(),
  parentOid: z.number().int(),
  argumentDataTypes: z.string(),
  defaultValues: z.string().nullable(),
  returnDataType: z.string().nullable(),
  returnsSet: z.boolean(),
});
