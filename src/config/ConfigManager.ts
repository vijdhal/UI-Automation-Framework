import * as fs from 'fs';
import * as path from 'path';
import {
  DBConfig,
  DataCloudConfig,
  Environment,
  EnvironmentConfig,
  SalesforceConfig,
} from './environment.interface';

const VALID_ENVIRONMENTS: ReadonlyArray<Environment> = ['dev', 'qa', 'uat'];

class ConfigManager {
  private static instance: ConfigManager;
  private readonly config: EnvironmentConfig;

  private constructor() {
    const env = this.resolveEnvironment();
    this.loadEnvFile(env);
    this.config = this.buildConfig(env);
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // ─── Env resolution ──────────────────────────────────────────────────────────

  private resolveEnvironment(): Environment {
    const raw = (process.env['ENV'] ?? 'dev').toLowerCase().trim();
    if (!VALID_ENVIRONMENTS.includes(raw as Environment)) {
      throw new Error(
        `Invalid environment "${raw}". Valid values: ${VALID_ENVIRONMENTS.join(', ')}`
      );
    }
    return raw as Environment;
  }

  private loadEnvFile(env: Environment): void {
    const envFilePath = path.resolve(process.cwd(), `.env.${env}`);
    if (!fs.existsSync(envFilePath)) {
      throw new Error(
        `Env file ".env.${env}" not found at ${envFilePath}.\n` +
        `Run: copy .env.example .env.${env}  then fill in the values.`
      );
    }
    const content = fs.readFileSync(envFilePath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key   = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private require(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Required env var "${key}" is missing or empty`);
    return value;
  }

  private optional(key: string, fallback = ''): string {
    return process.env[key] ?? fallback;
  }

  private requirePositiveInt(key: string): number {
    const raw = this.require(key);
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error(`Env var "${key}" must be a positive integer, got: "${raw}"`);
    }
    return parsed;
  }

  // ─── Builders ────────────────────────────────────────────────────────────────

  private buildConfig(env: Environment): EnvironmentConfig {
    return {
      env,
      baseUrl:    this.require('BASE_URL'),
      apiUrl:     this.require('API_URL'),
      db:         this.buildDbConfig(),
      salesforce: this.buildSalesforceConfig(),
      dataCloud:  this.buildDataCloudConfig(),
    };
  }

  private buildDbConfig(): DBConfig {
    return {
      host:     this.require('DB_HOST'),
      port:     this.requirePositiveInt('DB_PORT'),
      name:     this.require('DB_NAME'),
      user:     this.require('DB_USER'),
      password: this.require('DB_PASSWORD'),
    };
  }

  private buildSalesforceConfig(): SalesforceConfig {
    return {
      instanceUrl:   this.require('BASE_URL'),
      clientId:      this.optional('SF_CLIENT_ID'),
      clientSecret:  this.optional('SF_CLIENT_SECRET'),
      username:      this.optional('SF_USERNAME'),
      password:      this.optional('SF_PASSWORD'),
      securityToken: this.optional('SF_SECURITY_TOKEN'),
      authUrl:       this.optional('SF_AUTH_URL', 'https://login.salesforce.com/services/oauth2/token'),
      apiVersion:    this.optional('SF_API_VERSION', 'v62.0'),
    };
  }

  private buildDataCloudConfig(): DataCloudConfig {
    return {
      instanceUrl: this.require('BASE_URL'),
      apiVersion:  this.optional('SF_DC_API_VERSION', 'v1'),
    };
  }

  // ─── Public getters ──────────────────────────────────────────────────────────

  getBaseUrl(): string                            { return this.config.baseUrl; }
  getApiUrl(): string                             { return this.config.apiUrl; }
  getEnvironment(): Environment                   { return this.config.env; }
  getDBConfig(): Readonly<DBConfig>               { return Object.freeze({ ...this.config.db }); }
  getSalesforceConfig(): Readonly<SalesforceConfig> { return Object.freeze({ ...this.config.salesforce }); }
  getDataCloudConfig(): Readonly<DataCloudConfig> { return Object.freeze({ ...this.config.dataCloud }); }
  getConfig(): Readonly<EnvironmentConfig> {
    return Object.freeze({
      ...this.config,
      db:         Object.freeze({ ...this.config.db }),
      salesforce: Object.freeze({ ...this.config.salesforce }),
      dataCloud:  Object.freeze({ ...this.config.dataCloud }),
    });
  }
}

export const configManager = ConfigManager.getInstance();
export default ConfigManager;
