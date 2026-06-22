// ─── Domain types ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'standard' | 'readonly' | 'invalid';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
}

/** Credential returned by getCredentialByRole — username/password for a given role + env. */
export interface RoleCredential {
  username: string;
  password: string;
}

/** credentials.yaml structure — keyed by role, then by environment. */
export type RoleCredentialsYaml = Record<string, Record<string, RoleCredential>>;

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

// ─── Raw YAML document shapes ─────────────────────────────────────────────────

/** Per-environment user blocks within one test case entry. */
export type EnvUserMap = Partial<Record<'dev' | 'qa' | 'uat', User>>;

/** A user entry can be flat (same across all envs) or env-keyed. */
export type UserEntry = User | EnvUserMap;

/** users.yaml  — Record<testCaseName, UserEntry> */
export type UsersYaml = Record<string, UserEntry>;

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

export function assertRoleCredential(
  value: unknown,
  role: string,
  env: string
): asserts value is RoleCredential {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`Credential for role "${role}" / env "${env}" is not an object`);
  }
  const v = value as Record<string, unknown>;
  const missing = (['username', 'password'] as const).filter(f => typeof v[f] !== 'string');
  if (missing.length) {
    throw new TypeError(
      `Credential for role "${role}" / env "${env}" is missing: ${missing.join(', ')}`
    );
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
