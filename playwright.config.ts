import { defineConfig, devices } from '@playwright/test';
import { OrtoniReportConfig } from 'ortoni-report';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}` +
    `${pad(now.getMonth() + 1)}` +
    `${pad(now.getDate())}` +
    `-${pad(now.getHours())}` +
    `${pad(now.getMinutes())}` +
    `${pad(now.getSeconds())}`
  );
}

function loadEnv(env: string): void {
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
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

// ─── Environment + reporting ──────────────────────────────────────────────────

const env = (process.env['ENV'] ?? 'dev').toLowerCase().trim();
loadEnv(env);
const timestamp = buildTimestamp();

const ortoniConfig: OrtoniReportConfig = {
  open:        process.env['CI'] ? 'never' : 'on-failure',
  folderPath:  `ortoni-report-${env}-${timestamp}`,
  filename:    'index.html',
  title:       `UI Automation Report — ${env.toUpperCase()}`,
  projectName: 'UI Automation Framework',
  testType:    'Functional',
  authorName:  os.userInfo().username,
  base64Image: false,
  stdIO:       false,
  saveHistory: true,
  meta: {
    Environment:    env.toUpperCase(),
    Timestamp:      timestamp,
    Platform:       os.type(),
    'Node Version': process.version,
  },
};

// ─── Playwright config ────────────────────────────────────────────────────────

export default defineConfig({
  testDir:      './tests',
  fullyParallel: true,
  forbidOnly:   !!process.env['CI'],
  retries:      process.env['CI'] ? 2 : 0,
  workers:      process.env['CI'] ? 1 : undefined,
  timeout:      60_000,

  reporter: [
    ['list'],
    ['html',          { open: 'never' }],
    ['ortoni-report', ortoniConfig],
  ],

  use: {
    baseURL:           process.env['BASE_URL'] ?? '',
    navigationTimeout: 60_000,
    actionTimeout:     30_000,
    trace:             'on-first-retry',
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
  },

  projects: [
    // ── SF auth setup (runs once before sf-chromium) ──────────────────────────
    {
      name:      'sf-setup',
      testMatch: /sfAuth\.setup\.ts/,
    },

    // ── Non-SF tests (no storageState required) ───────────────────────────────
    {
      name:       'chromium',
      testIgnore: ['**/salesforce/**'],
      use:        { ...devices['Desktop Chrome'] },
    },
    {
      name:       'firefox',
      testIgnore: ['**/salesforce/**'],
      use:        { ...devices['Desktop Firefox'] },
    },
    {
      name:       'webkit',
      testIgnore: ['**/salesforce/**'],
      use:        { ...devices['Desktop Safari'] },
    },

    // ── Salesforce tests (authenticated via storageState) ─────────────────────
    // login.spec.ts overrides storageState with test.use({ storageState: undefined })
    {
      name:         'sf-chromium',
      testDir:      './tests/salesforce',
      dependencies: ['sf-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sf-admin.json',
      },
    },
  ],
});
