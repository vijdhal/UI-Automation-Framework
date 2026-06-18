import { ISalesforceApiClient } from '../../interfaces/ISalesforceApiClient';
import { ILogger } from '../../interfaces/ILogger';
import { SfRecord, SoqlResult } from '../../interfaces/salesforce.types';
import { SalesforceAuthManager } from './SalesforceAuthManager';
import { createLogger } from '../../utils/Logger';

export class SalesforceApiClient implements ISalesforceApiClient {
  constructor(
    private readonly authManager: SalesforceAuthManager,
    private readonly logger: ILogger = createLogger('SF:ApiClient')
  ) {}

  // ─── Public API ───────────────────────────────────────────────────────────────

  async query<T extends SfRecord>(soql: string): Promise<T[]> {
    const result = await this.queryRaw<T>(soql);
    return result.records;
  }

  async queryRaw<T extends SfRecord>(soql: string): Promise<SoqlResult<T>> {
    this.logger.info(`SOQL → ${soql}`);
    const { accessToken, instanceUrl } = await this.authManager.getToken();
    const version = process.env['SF_API_VERSION'] ?? 'v62.0';

    const url = `${instanceUrl}/services/data/${version}/query?q=${encodeURIComponent(soql)}`;
    const response = await this.request<SoqlResult<T>>(url, 'GET', accessToken);

    this.logger.info(`SOQL result: ${response.totalSize} record(s)`);
    return response;
  }

  async getRecord<T extends SfRecord>(
    sobject: string,
    id: string,
    fields?: string[]
  ): Promise<T> {
    const { accessToken, instanceUrl } = await this.authManager.getToken();
    const version = process.env['SF_API_VERSION'] ?? 'v62.0';

    const fieldsParam = fields?.length ? `?fields=${fields.join(',')}` : '';
    const url = `${instanceUrl}/services/data/${version}/sobjects/${sobject}/${id}${fieldsParam}`;

    this.logger.info(`getRecord → ${sobject}/${id}`);
    return this.request<T>(url, 'GET', accessToken);
  }

  async getRecordsByField<T extends SfRecord>(
    sobject: string,
    field: string,
    value: string,
    fields: string[]
  ): Promise<T[]> {
    const fieldList = fields.join(', ');
    const soql = `SELECT ${fieldList} FROM ${sobject} WHERE ${field} = '${value.replace(/'/g, "\\'")}'`;
    return this.query<T>(soql);
  }

  // ─── HTTP helper ─────────────────────────────────────────────────────────────

  private async request<T>(url: string, method: string, accessToken: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept:         'application/json',
        },
      });
    } catch (err) {
      this.logger.error(`SF API network error: ${url}`, err);
      throw new Error(`SF API request failed: ${String(err)}`);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(`SF API HTTP ${response.status}: ${url}`, undefined, { body });
      throw new Error(`SF API ${response.status} on ${url}: ${body}`);
    }

    return response.json() as Promise<T>;
  }
}

// ─── Singleton factory ────────────────────────────────────────────────────────

let _instance: SalesforceApiClient | null = null;

export function getSalesforceApiClient(): SalesforceApiClient {
  if (!_instance) {
    const logger = createLogger('SF:AuthManager');
    const authManager = new SalesforceAuthManager({
      instanceUrl:   process.env['BASE_URL'] ?? '',
      clientId:      process.env['SF_CLIENT_ID'] ?? '',
      clientSecret:  process.env['SF_CLIENT_SECRET'] ?? '',
      username:      process.env['SF_USERNAME'] ?? '',
      password:      process.env['SF_PASSWORD'] ?? '',
      securityToken: process.env['SF_SECURITY_TOKEN'] ?? '',
      authUrl:       process.env['SF_AUTH_URL'] ?? 'https://login.salesforce.com/services/oauth2/token',
      apiVersion:    process.env['SF_API_VERSION'] ?? 'v62.0',
    }, logger);
    _instance = new SalesforceApiClient(authManager);
  }
  return _instance;
}
