import { z } from 'zod';

export const relationKind = z.enum(['r', 'v', 'm', 'p']);

export const generationMethod = z.enum(['d', 'a', 's']);

export const pgTypeCategories = z.enum(['b', 'c', 'd', 'e', 'p', 'r', 'm']);

export const constraintType = z.enum(['c', 'f', 'p', 'u', 't', 'x']);
