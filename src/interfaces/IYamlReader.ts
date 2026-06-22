import { EnvironmentData, RoleCredential, User } from './yaml.types';

export interface IYamlReader {
  /** Loads an entire YAML file and returns it as T. Result is cached by path. */
  load<T>(filePath: string): T;

  /** Loads the file and returns the value at `key`. Useful for ad-hoc YAML files. */
  get<T>(key: string, filePath: string): T;

  /**
   * Returns User data whose key matches the test case name.
   * Picks the env-specific block when the entry is keyed by environment.
   * Defaults to process.env['ENV'] ?? 'dev'.
   */
  getUser(testCaseName: string, env?: string): User;

  /**
   * Returns credentials for the given role from credentials.yaml.
   * Automatically picks the right env block (dev | qa | uat).
   * Defaults to process.env['ENV'] ?? 'dev'.
   *
   * Usage: yamlReader.getCredentialByRole('admin')
   */
  getCredentialByRole(role: string, env?: string): RoleCredential;

  /** Returns EnvironmentData for the given environment name (dev | qa | uat). */
  getEnvironment(envName: string): EnvironmentData;

  /** Evicts all cached files so they are re-read on next access. */
  clearCache(): void;
}
