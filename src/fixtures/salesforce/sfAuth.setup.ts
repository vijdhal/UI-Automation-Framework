import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { SalesforceLocators } from '../../locators/SalesforceLocators';

export const SF_AUTH_FILE = path.resolve('.auth', 'sf-admin.json');

const SF_LOGIN_URL    = 'https://login.salesforce.com';
const POST_LOGIN_REGEX = /\.salesforce\.com|\.force\.com/;

setup('authenticate to Salesforce', async ({ page }) => {
  const sfUsername = process.env['SF_USERNAME'] ?? '';
  const sfPassword = process.env['SF_PASSWORD'] ?? '';

  if (!sfUsername || !sfPassword) {
    throw new Error(
      'SF_USERNAME and SF_PASSWORD must be set in the .env file before running SF tests.'
    );
  }

  fs.mkdirSync(path.dirname(SF_AUTH_FILE), { recursive: true });

  await page.goto(SF_LOGIN_URL);
  await expect(page.locator(SalesforceLocators.login.usernameInput)).toBeVisible({ timeout: 15_000 });

  await page.fill(SalesforceLocators.login.usernameInput, sfUsername);
  await page.fill(SalesforceLocators.login.passwordInput, sfPassword);
  await page.click(SalesforceLocators.login.loginButton);

  await page.waitForURL(POST_LOGIN_REGEX, { timeout: 60_000 });

  await expect(page.locator(SalesforceLocators.home.appLauncherButton)).toBeVisible({
    timeout: 60_000,
  });

  await page.context().storageState({ path: SF_AUTH_FILE });
  console.log(`✓ SF auth state saved → ${SF_AUTH_FILE}`);
});
