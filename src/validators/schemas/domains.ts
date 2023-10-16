import { z } from 'zod';
import { collationsQueryValidator } from './collations';

export type DomainQuery = z.infer<typeof domainsQueryValidator>;

const domainCheckConstraint = z.object({
  name: z.string(),
  oid: z.string(),
  definition: z.string(),
  description: z.string().nullable(),
  isValidated: z.boolean(),
  isDeferrable: z.boolean(),
  isDeferred: z.boolean(),
});

export const domainsQueryValidator = z.object({
  name: z.string(),
  oid: z.number().int(),
  parentOid: z.number().int(),
  defaultValue: z.string().nullable(),
  description: z.string().nullable(),
  dataType: z.string(),
  collation: collationsQueryValidator.nullable(),
  constraints: z.array(domainCheckConstraint).transform((constraints) =>
    constraints.reduce(
      (acc: Record<string, z.infer<typeof domainCheckConstraint>>, cur) => {
        acc[cur.name] = cur;
        return acc;
      },
      {}
    )
  ),
});
