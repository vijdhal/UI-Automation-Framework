import { ILogger } from '../../interfaces/ILogger';
import { SalesforceConfig } from '../../config/environment.interface';

export interface SalesforceToken {
  accessToken: string;
  instanceUrl: string;
  tokenType: string;
  issuedAt: number;
}

interface TokenResponse {
  access_token: string;
  instance_url: string;
  token_type: string;
  issued_at: string;
  id: string;
  signature: string;
}

const TOKEN_TTL_MS = 60 * 60 * 1000; // treat tokens as valid for 1 hour

export class SalesforceAuthManager {
  private token: SalesforceToken | null = null;

  constructor(
    private readonly sfConfig: Readonly<SalesforceConfig>,
    private readonly logger: ILogger
  ) {}

  async getToken(): Promise<SalesforceToken> {
    if (this.token && !this.isExpired(this.token)) {
      this.logger.debug('SF auth: using cached token');
      return this.token;
    }
    this.token = await this.fetchToken();
    return this.token;
  }

  /** Force a fresh token on the next call. */
  invalidate(): void {
    this.token = null;
    this.logger.info('SF auth: token invalidated');
  }

  private async fetchToken(): Promise<SalesforceToken> {
    this.validateConfig();
    this.logger.info(`SF auth: requesting token from ${this.sfConfig.authUrl}`);

    const body = new URLSearchParams({
      grant_type:    'password',
      client_id:     this.sfConfig.clientId,
      client_secret: this.sfConfig.clientSecret,
      username:      this.sfConfig.username,
      password:      this.sfConfig.password + this.sfConfig.securityToken,
    });

    let response: Response;
    try {
      response = await fetch(this.sfConfig.authUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    body.toString(),
      });
    } catch (err) {
      this.logger.error('SF auth: network error', err);
      throw new Error(`SF OAuth request failed: ${String(err)}`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(`SF auth: HTTP ${response.status}`, undefined, { body: text });
      throw new Error(`SF OAuth failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as TokenResponse;
    const token: SalesforceToken = {
      accessToken: data.access_token,
      instanceUrl: data.instance_url,
      tokenType:   data.token_type,
      issuedAt:    parseInt(data.issued_at, 10),
    };

    this.logger.info(`SF auth: token obtained — instance: ${token.instanceUrl}`);
    return token;
  }

  private isExpired(token: SalesforceToken): boolean {
    return Date.now() - token.issuedAt > TOKEN_TTL_MS;
  }

  private validateConfig(): void {
    const missing = (['clientId', 'clientSecret', 'username', 'password'] as const)
      .filter(k => !this.sfConfig[k]);
    if (missing.length) {
      throw new Error(
        `SF API config is incomplete. Set these env vars: ${missing.map(k => `SF_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`).join(', ')}`
      );
    }
  }
}
