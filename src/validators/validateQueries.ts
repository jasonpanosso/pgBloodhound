import { z } from 'zod';
import {
  namespaceQueryValidator,
  relationsQueryValidator,
  columnsQueryValidator,
  constraintsQueryValidator,
} from './schemas';

export function validateColumnsQuery(queryResult: unknown[]) {
  return z.array(columnsQueryValidator).parse(queryResult);
}

export function validateConstraintsQuery(queryResult: unknown[]) {
  return z.array(constraintsQueryValidator).parse(queryResult);
}

export function validateNamespacesQuery(queryResult: unknown[]) {
  return z.array(namespaceQueryValidator).parse(queryResult);
}

export function validateRelationsQuery(queryResult: unknown[]) {
  return z.array(relationsQueryValidator).parse(queryResult);
}
