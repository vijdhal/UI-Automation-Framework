import { IDataCloudApiClient } from '../../interfaces/IDataCloudApiClient';
import { ILogger } from '../../interfaces/ILogger';
import { DataCloudQueryResult } from '../../interfaces/salesforce.types';
import { SalesforceAuthManager } from '../salesforce/SalesforceAuthManager';
import { createLogger } from '../../utils/Logger';

export class DataCloudApiClient implements IDataCloudApiClient {
  constructor(
    private readonly authManager: SalesforceAuthManager,
    private readonly logger: ILogger = createLogger('SF:DataCloudClient')
  ) {}

  // ─── Public API ───────────────────────────────────────────────────────────────

  async query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    const result = await this.queryRaw<T>(sql);
    return result.data;
  }

  async queryRaw<T = Record<string, unknown>>(sql: string): Promise<DataCloudQueryResult<T>> {
    this.logger.info(`Data Cloud SQL → ${sql}`);

    const { accessToken, instanceUrl } = await this.authManager.getToken();
    const dcApiVersion = process.env['SF_DC_API_VERSION'] ?? 'v1';
    const url = `${instanceUrl}/api/${dcApiVersion}/query`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept:         'application/json',
        },
        body: JSON.stringify({ sql }),
      });
    } catch (err) {
      this.logger.error('Data Cloud: network error', err);
      throw new Error(`Data Cloud request failed: ${String(err)}`);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(`Data Cloud HTTP ${response.status}`, undefined, { body });
      throw new Error(`Data Cloud ${response.status}: ${body}`);
    }

    const result = (await response.json()) as DataCloudQueryResult<T>;
    this.logger.info(`Data Cloud result: ${result.rowCount} row(s) in ${result.processingTime}ms`);
    return result;
  }
}

// ─── Singleton factory ────────────────────────────────────────────────────────

let _instance: DataCloudApiClient | null = null;

export function getDataCloudApiClient(): DataCloudApiClient {
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
    _instance = new DataCloudApiClient(authManager);
  }
  return _instance;
}
