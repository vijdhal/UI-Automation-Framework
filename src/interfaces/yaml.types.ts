// ─── Domain types ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'standard' | 'readonly';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export interface Credential {
  username: string;
  password: string;
  role: UserRole;
  environment?: string;
}

/** What environments.yaml stores per env key. baseUrl/apiUrl come from process.env at runtime. */
export interface EnvironmentYamlEntry {
  timeout: number;
  features: Record<string, boolean>;
}

/** Full environment config returned by getEnvironment(). */
export interface EnvironmentData extends EnvironmentYamlEntry {
  name: string;
  baseUrl: string;
  apiUrl: string;
}

// ─── Raw YAML document shapes (top-level key = test case name or env name) ────

/** users.yaml  — Record<testCaseName, User> */
export type UsersYaml = Record<string, User>;

/** credentials.yaml  — Record<testCaseName, Credential> */
export type CredentialsYaml = Record<string, Credential>;

/** environments.yaml  — Record<envName, EnvironmentYamlEntry> */
export type EnvironmentsYaml = Record<string, EnvironmentYamlEntry>;

// ─── Runtime type-guards ──────────────────────────────────────────────────────

export function assertUser(value: unknown, key: string): asserts value is User {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`User data for "${key}" is missing or not an object`);
  }
  const v = value as Record<string, unknown>;
  const missing = (['id', 'firstName', 'lastName', 'email', 'role'] as const).filter(
    f => typeof v[f] !== 'string'
  );
  if (missing.length) {
    throw new TypeError(`User "${key}" is missing required string fields: ${missing.join(', ')}`);
  }
}

export function assertCredential(value: unknown, key: string): asserts value is Credential {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`Credential data for "${key}" is missing or not an object`);
  }
  const v = value as Record<string, unknown>;
  const missing = (['username', 'password', 'role'] as const).filter(
    f => typeof v[f] !== 'string'
  );
  if (missing.length) {
    throw new TypeError(`Credential "${key}" is missing required string fields: ${missing.join(', ')}`);
  }
}

/** Validates only the fields stored in environments.yaml (no baseUrl/apiUrl). */
export function assertEnvironmentYamlEntry(
  value: unknown,
  key: string
): asserts value is EnvironmentYamlEntry {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`Environment entry for "${key}" is missing or not an object`);
  }
  const v = value as Record<string, unknown>;
  if (typeof v['timeout'] !== 'number') {
    throw new TypeError(`Environment "${key}" must have a numeric "timeout" field`);
  }
  if (typeof v['features'] !== 'object' || v['features'] === null) {
    throw new TypeError(`Environment "${key}" must have a "features" object`);
  }
}
