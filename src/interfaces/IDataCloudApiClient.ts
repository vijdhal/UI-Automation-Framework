import { DataCloudQueryResult } from './salesforce.types';

export interface IDataCloudApiClient {
  /** Run a SQL query against Salesforce Data Cloud and return the data rows. */
  query<T = Record<string, unknown>>(sql: string): Promise<T[]>;

  /** Run a SQL query and return the full result envelope (rowCount, metadata, timing). */
  queryRaw<T = Record<string, unknown>>(sql: string): Promise<DataCloudQueryResult<T>>;
}
