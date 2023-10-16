import { readFile } from 'fs/promises';
import { isNodeError } from '@/utils/errorHandlers';
import { join } from 'path';
import type { Client } from 'pg';

export enum SqlFileName {
  Columns = 'columns.sql',
  CompositeTypes = 'compositeTypes.sql',
  Constraints = 'constraints.sql',
  Domains = 'domains.sql',
  Enums = 'enums.sql',
  Namespaces = 'namespaces.sql',
  Ranges = 'ranges.sql',
  Relations = 'relations.sql',
}

export async function executeSqlFile(
  db: Client,
  fileName: SqlFileName,
  filteredOids: number[] = []
): Promise<unknown[]> {
  try {
    const filePath = join(__dirname, './sql', fileName);
    const sqlQueryString = await readFile(filePath, 'utf8');
    const result = await db.query(sqlQueryString, [filteredOids]);

    return result.rows as unknown[];
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      throw Error(
        `File name: "${fileName}" passed to function "executeSqlFile" not found`
      );
    } else {
      throw err;
    }
  }
}
