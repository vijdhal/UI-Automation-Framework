import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { SalesforceLocators } from '../../locators/SalesforceLocators';

export const SF_AUTH_FILE = path.resolve('.auth', 'sf-admin.json');

const SF_LOGIN_URL     = 'https://login.salesforce.com';
const MFA_INDICATORS   = ['EmailVerification', '/identity/verification/', 'mfa', 'challenge'];
const POST_LOGIN_REGEX  = /\.salesforce\.com|\.force\.com/;

/**
 * Runs ONCE before the sf-chromium project.
 * Logs in to Salesforce and saves the authenticated browser state.
 *
 * Requirements:
 *   - SF_USERNAME and SF_PASSWORD must be set in the active .env.* file
 *   - The test runner's IP must be in Salesforce Trusted IP Ranges, OR
 *     MFA must be disabled for the test user (Setup → User → uncheck MFA)
 */
setup('authenticate to Salesforce', async ({ page }) => {
  const sfUsername = process.env['SF_USERNAME'] ?? '';
  const sfPassword = process.env['SF_PASSWORD'] ?? '';

  if (!sfUsername || !sfPassword) {
    throw new Error(
      'SF_USERNAME and SF_PASSWORD must be set in the .env file before running SF tests.'
    );
  }

  // Ensure .auth directory exists
  fs.mkdirSync(path.dirname(SF_AUTH_FILE), { recursive: true });

  // ── Login ─────────────────────────────────────────────────────────────────────
  await page.goto(SF_LOGIN_URL);
  await expect(page.locator(SalesforceLocators.login.usernameInput)).toBeVisible({ timeout: 15_000 });

  await page.fill(SalesforceLocators.login.usernameInput, sfUsername);
  await page.fill(SalesforceLocators.login.passwordInput, sfPassword);
  await page.click(SalesforceLocators.login.loginButton);

  // ── Wait for redirect away from login.salesforce.com ─────────────────────────
  await page.waitForURL(POST_LOGIN_REGEX, { timeout: 60_000 });

  // ── MFA guard ─────────────────────────────────────────────────────────────────
  const currentUrl = page.url();
  const mfaTriggered = MFA_INDICATORS.some(indicator => currentUrl.includes(indicator));
  if (mfaTriggered) {
    throw new Error(
      `Salesforce requires identity verification (MFA) — URL: ${currentUrl}\n\n` +
      'To fix this:\n' +
      '  1. Add the test machine IP to Salesforce Trusted IP Ranges\n' +
      '     (Setup → Security → Network Access → New)\n' +
      '  2. Or disable MFA for the test user\n' +
      '     (Setup → Users → [user] → uncheck "MFA for User Interface Logins")'
    );
  }

  // ── Wait for Lightning home to fully render ───────────────────────────────────
  await expect(page.locator(SalesforceLocators.home.appLauncherButton)).toBeVisible({
    timeout: 60_000,
  });

  // ── Save authenticated state ──────────────────────────────────────────────────
  await page.context().storageState({ path: SF_AUTH_FILE });
  console.log(`✓ SF auth state saved → ${SF_AUTH_FILE}`);
});
