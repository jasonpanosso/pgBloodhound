import type { DatabaseObject } from '@/types/Database';

export function handleSqlQueryError(
  err: unknown,
  schema: string,
  introspectedType: string
) {
  if (err instanceof Error) {
    return new Error(
      `SQL error while introspecting ${introspectedType} for ${schema} schema: ${err.message}`
    );
  } else {
    return new Error(
      `An unknown occured while introspecting ${introspectedType} for ${schema} schema: ${String(
        err
      )}`
    );
  }
}

export function handleQueryReturnedNoResults(
  databaseObjects: DatabaseObject[],
  schema: string,
  introspectedType: string
) {
  throw new Error(
    `No data found while introspecting ${introspectedType}: ${databaseObjects
      .map((obj) => `'${schema}.${obj.objectName}'`)
      .join(', ')}`
  );
}
