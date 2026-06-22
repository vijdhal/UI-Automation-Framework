import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { IYamlReader } from '../interfaces/IYamlReader';
import { ILogger } from '../interfaces/ILogger';
import { createLogger } from './Logger';
import {
  EnvironmentData,
  EnvironmentsYaml,
  RoleCredential,
  RoleCredentialsYaml,
  User,
  UsersYaml,
  assertEnvironmentYamlEntry,
  assertRoleCredential,
  assertUser,
} from '../interfaces/yaml.types';

const YAML_DIR          = path.resolve(process.cwd(), 'src', 'testdata', 'yaml');
const USERS_FILE        = path.join(YAML_DIR, 'users.yaml');
const CREDENTIALS_FILE  = path.join(YAML_DIR, 'credentials.yaml');
const ENVIRONMENTS_FILE = path.join(YAML_DIR, 'environments.yaml');

class YamlReader implements IYamlReader {
  private readonly cache = new Map<string, unknown>();

  constructor(private readonly logger: ILogger = createLogger('YamlReader')) {}

  // ─── Generic API ─────────────────────────────────────────────────────────────

  load<T>(filePath: string): T {
    const absolutePath = path.resolve(filePath);

    if (this.cache.has(absolutePath)) {
      this.logger.debug(`Cache hit → ${absolutePath}`);
      return this.cache.get(absolutePath) as T;
    }

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`YAML file not found: ${absolutePath}`);
    }

    this.logger.info(`Loading YAML → ${absolutePath}`);

    let raw: string;
    try {
      raw = fs.readFileSync(absolutePath, 'utf8');
    } catch (err) {
      this.logger.error(`Cannot read file: ${absolutePath}`, err);
      throw new Error(`Cannot read YAML file "${absolutePath}": ${String(err)}`);
    }

    let parsed: unknown;
    try {
      parsed = yaml.load(raw);
    } catch (err) {
      this.logger.error(`YAML parse error: ${absolutePath}`, err);
      throw new Error(`Failed to parse "${absolutePath}": ${(err as yaml.YAMLException).message}`);
    }

    if (parsed === null || parsed === undefined) {
      throw new Error(`YAML file is empty: ${absolutePath}`);
    }

    this.cache.set(absolutePath, parsed);
    this.logger.info(`Cached → ${absolutePath}`);
    return parsed as T;
  }

  get<T>(key: string, filePath: string): T {
    const doc = this.load<Record<string, unknown>>(filePath);

    if (!(key in doc)) {
      const available = Object.keys(doc).join(', ');
      throw new Error(
        `Key "${key}" not found in "${filePath}". Available keys: ${available}`
      );
    }

    this.logger.debug(`Resolved key "${key}" from ${filePath}`);
    return doc[key] as T;
  }

  // ─── Typed helpers ────────────────────────────────────────────────────────────

  getUser(testCaseName: string, env: string = process.env['ENV'] ?? 'dev'): User {
    this.logger.info(`getUser → testCase: "${testCaseName}", env: "${env}"`);
    const doc = this.load<UsersYaml>(USERS_FILE);
    const entry: unknown = doc[testCaseName];

    if (entry === undefined) {
      const available = Object.keys(doc).join(', ');
      throw new Error(
        `No user entry for test case "${testCaseName}" in users.yaml.\nAvailable: ${available}`
      );
    }

    const value = this.resolveEnvEntry(entry, env, testCaseName, 'users.yaml');
    assertUser(value, `${testCaseName}[${env}]`);
    return value;
  }

  /**
   * Returns credentials for the given role from credentials.yaml.
   * Automatically picks the correct env block (dev | qa | uat).
   *
   * Usage: yamlReader.getCredentialByRole('admin')
   */
  getCredentialByRole(role: string, env: string = process.env['ENV'] ?? 'dev'): RoleCredential {
    this.logger.info(`getCredentialByRole → role: "${role}", env: "${env}"`);
    const doc = this.load<RoleCredentialsYaml>(CREDENTIALS_FILE);

    const roleEntry = doc[role];
    if (!roleEntry) {
      const available = Object.keys(doc).join(', ');
      throw new Error(
        `No credentials for role "${role}" in credentials.yaml.\nAvailable roles: ${available}`
      );
    }

    const envEntry = roleEntry[env];
    if (!envEntry) {
      const available = Object.keys(roleEntry).join(', ');
      throw new Error(
        `No credentials for role "${role}" / env "${env}" in credentials.yaml.\nAvailable envs: ${available}`
      );
    }

    assertRoleCredential(envEntry, role, env);
    return envEntry;
  }

  getEnvironment(envName: string): EnvironmentData {
    this.logger.info(`getEnvironment → env: "${envName}"`);
    const doc = this.load<EnvironmentsYaml>(ENVIRONMENTS_FILE);
    const entry: unknown = doc[envName];

    if (entry === undefined) {
      const available = Object.keys(doc).join(', ');
      throw new Error(
        `No environment entry for "${envName}" in environments.yaml.\nAvailable: ${available}`
      );
    }

    assertEnvironmentYamlEntry(entry, envName);

    return {
      name:     envName,
      baseUrl:  process.env['BASE_URL'] ?? '',
      apiUrl:   process.env['API_URL'] ?? '',
      timeout:  entry.timeout,
      features: entry.features,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private resolveEnvEntry(entry: unknown, env: string, testCaseName: string, file: string): unknown {
    if (typeof entry !== 'object' || entry === null) return entry;

    const asMap = entry as Record<string, unknown>;
    if (env in asMap) {
      this.logger.debug(`Resolved env-specific entry for "${testCaseName}" [${env}] from ${file}`);
      return asMap[env];
    }

    this.logger.debug(`Using flat entry for "${testCaseName}" (no env block for "${env}") from ${file}`);
    return entry;
  }

  // ─── Cache management ─────────────────────────────────────────────────────────

  clearCache(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.logger.info(`Cache cleared (${count} file(s) evicted)`);
  }
}

/** Singleton — import and use directly in tests. */
export const yamlReader = new YamlReader();

/** Named export for custom instances (e.g. injecting a test logger). */
export { YamlReader };
