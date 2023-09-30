import { readFile } from 'fs/promises';
import { isNodeError } from './errorHandlers';
import { join } from 'path';
import type { Client } from 'pg';

export async function executeSqlFile(
  db: Client,
  file: string,
  schemas: string[]
): Promise<unknown> {
  try {
    const filePath = join(__dirname, '../sql', `${file}.sql`);
    const sqlQueryString = await readFile(filePath, 'utf8');
    const result = await db.query(sqlQueryString, [schemas]);

    return result.rows as unknown;
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      throw Error(
        `File name: "${file}" passed to function "executeSqlFile" not found`
      );
    } else {
      throw err;
    }
  }
}
