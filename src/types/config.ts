import type { ClientConfig } from 'pg';

export interface BloodhoundConfig {
  connectionConfig: ClientConfig;
  namespaces?: string[] | undefined;
}
