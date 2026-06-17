import { Credential, EnvironmentData, User } from './yaml.types';

export interface IYamlReader {
  /**
   * Generic parser — loads an entire YAML file and returns it as T.
   * Result is cached by absolute file path.
   */
  load<T>(filePath: string): T;

  /**
   * Generic keyed getter — loads the file and returns the value at `key`.
   * Useful for ad-hoc YAML files beyond the three built-in datasets.
   */
  get<T>(key: string, filePath: string): T;

  /**
   * Returns User data whose key matches the test case name.
   * Reads from src/testdata/yaml/users.yaml.
   */
  getUser(testCaseName: string): User;

  /**
   * Returns Credential data whose key matches the test case name.
   * Reads from src/testdata/yaml/credentials.yaml.
   */
  getCredential(testCaseName: string): Credential;

  /**
   * Returns EnvironmentData for the given environment name (dev | qa | uat).
   * Reads from src/testdata/yaml/environments.yaml.
   */
  getEnvironment(envName: string): EnvironmentData;

  /** Evicts all cached files so they are re-read on next access. */
  clearCache(): void;
}
