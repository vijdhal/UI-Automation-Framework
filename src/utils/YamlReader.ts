import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { IYamlReader } from '../interfaces/IYamlReader';
import { ILogger } from '../interfaces/ILogger';
import { createLogger } from './Logger';
import {
  Credential,
  CredentialsYaml,
  EnvironmentData,
  EnvironmentsYaml,
  User,
  UsersYaml,
  assertCredential,
  assertEnvironmentYamlEntry,
  assertUser,
} from '../interfaces/yaml.types';
import { configManager } from '../config/ConfigManager';

const YAML_DIR = path.resolve(process.cwd(), 'src', 'testdata', 'yaml');
const USERS_FILE = path.join(YAML_DIR, 'users.yaml');
const CREDENTIALS_FILE = path.join(YAML_DIR, 'credentials.yaml');
const ENVIRONMENTS_FILE = path.join(YAML_DIR, 'environments.yaml');

class YamlReader implements IYamlReader {
  /** Keyed by absolute file path */
  private readonly cache = new Map<string, unknown>();

  constructor(private readonly logger: ILogger = createLogger('YamlReader')) {}

  // ─── Generic API ─────────────────────────────────────────────────────────────

  /**
   * Loads and caches a YAML file. Subsequent calls return the cached value
   * without touching disk.
   */
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

  /**
   * Loads the YAML file and returns the value at `key`.
   * Throws a descriptive error when the key is absent.
   */
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

  // ─── Typed helpers (test-case-name keyed) ────────────────────────────────────

  /**
   * Looks up User data by test case name.
   *
   * Usage inside a Playwright test:
   *   const user = yamlReader.getUser(testInfo.title);
   */
  getUser(testCaseName: string): User {
    this.logger.info(`getUser → testCase: "${testCaseName}"`);
    const doc = this.load<UsersYaml>(USERS_FILE);
    const value: unknown = doc[testCaseName];

    if (value === undefined) {
      const available = Object.keys(doc).join(', ');
      throw new Error(
        `No user entry for test case "${testCaseName}" in users.yaml.\nAvailable: ${available}`
      );
    }

    assertUser(value, testCaseName);
    return value;
  }

  /**
   * Looks up Credential data by test case name.
   *
   * Usage inside a Playwright test:
   *   const cred = yamlReader.getCredential(testInfo.title);
   */
  getCredential(testCaseName: string): Credential {
    this.logger.info(`getCredential → testCase: "${testCaseName}"`);
    const doc = this.load<CredentialsYaml>(CREDENTIALS_FILE);
    const value: unknown = doc[testCaseName];

    if (value === undefined) {
      const available = Object.keys(doc).join(', ');
      throw new Error(
        `No credential entry for test case "${testCaseName}" in credentials.yaml.\nAvailable: ${available}`
      );
    }

    assertCredential(value, testCaseName);
    return value;
  }

  /**
   * Returns a complete EnvironmentData for the given environment name.
   *
   * - timeout and features are read from environments.yaml
   * - baseUrl and apiUrl come from the active .env.* file via ConfigManager
   *
   * Usage inside a Playwright test:
   *   const env = yamlReader.getEnvironment(process.env['ENV'] ?? 'dev');
   */
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
      name: envName,
      baseUrl: configManager.getBaseUrl(),
      apiUrl: configManager.getApiUrl(),
      timeout: entry.timeout,
      features: entry.features,
    };
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
