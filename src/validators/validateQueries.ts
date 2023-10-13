import { z } from 'zod';
import {
  namespacesQueryValidator,
  relationsQueryValidator,
  columnsQueryValidator,
  constraintsQueryValidator,
  enumsQueryValidator,
  domainsQueryValidator,
  rangesQueryValidator,
  compositeTypeQueryValidator,
} from './schemas';

export function validateColumnsQuery(queryResult: unknown[]) {
  return z.array(columnsQueryValidator).parse(queryResult);
}

export function validateConstraintsQuery(queryResult: unknown[]) {
  return z.array(constraintsQueryValidator).parse(queryResult);
}

export function validateNamespacesQuery(queryResult: unknown[]) {
  return z.array(namespacesQueryValidator).parse(queryResult);
}

export function validateRelationsQuery(queryResult: unknown[]) {
  return z.array(relationsQueryValidator).parse(queryResult);
}

export function validateEnumsQuery(queryResult: unknown[]) {
  return z.array(enumsQueryValidator).parse(queryResult);
}

export function validateDomainsQuery(queryResult: unknown[]) {
  return z.array(domainsQueryValidator).parse(queryResult);
}

export function validateRangesQuery(queryResult: unknown[]) {
  return z.array(rangesQueryValidator).parse(queryResult);
}

export function validateCompositeTypesQuery(queryResult: unknown[]) {
  return z.array(compositeTypeQueryValidator).parse(queryResult);
}
