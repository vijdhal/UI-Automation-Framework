import { IDataCloudApiClient } from '../../interfaces/IDataCloudApiClient';
import { ILogger } from '../../interfaces/ILogger';
import { DataCloudQueryResult } from '../../interfaces/salesforce.types';
import { SalesforceAuthManager } from '../salesforce/SalesforceAuthManager';
import { configManager } from '../../config/ConfigManager';
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
    const dcConfig = configManager.getDataCloudConfig();
    const url = `${instanceUrl}/api/${dcConfig.apiVersion}/query`;

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
    const authManager = new SalesforceAuthManager(configManager.getSalesforceConfig(), logger);
    _instance = new DataCloudApiClient(authManager);
  }
  return _instance;
}
