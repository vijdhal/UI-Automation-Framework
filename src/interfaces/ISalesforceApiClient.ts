import { SfRecord, SoqlResult } from './salesforce.types';

export interface ISalesforceApiClient {
  /** Run a SOQL query and return the records array. */
  query<T extends SfRecord>(soql: string): Promise<T[]>;

  /** Fetch a single record by Id, optionally limiting to specific fields. */
  getRecord<T extends SfRecord>(sobject: string, id: string, fields?: string[]): Promise<T>;

  /** Fetch records where a given field equals a value. */
  getRecordsByField<T extends SfRecord>(
    sobject: string,
    field: string,
    value: string,
    fields: string[]
  ): Promise<T[]>;

  /** Run a SOQL query and return the raw SOQL result envelope. */
  queryRaw<T extends SfRecord>(soql: string): Promise<SoqlResult<T>>;
}
