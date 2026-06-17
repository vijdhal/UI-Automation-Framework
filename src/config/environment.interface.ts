export type Environment = 'dev' | 'qa' | 'uat';

export interface DBConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

export interface SalesforceConfig {
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  securityToken: string;
  authUrl: string;
  apiVersion: string;
}

export interface DataCloudConfig {
  instanceUrl: string;
  apiVersion: string;
}

export interface EnvironmentConfig {
  env: Environment;
  baseUrl: string;
  apiUrl: string;
  db: DBConfig;
  salesforce: SalesforceConfig;
  dataCloud: DataCloudConfig;
}
