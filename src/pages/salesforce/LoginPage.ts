import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { SalesforceLocators } from '../../locators/SalesforceLocators';
import { createLogger } from '../../utils/Logger';

const SF_LOGIN_URL = 'https://login.salesforce.com';
const POST_LOGIN_URL_PATTERN = /\.salesforce\.com|\.force\.com/;

export class LoginPage extends BasePage {
  private readonly loc = SalesforceLocators.login;
  private readonly homeLoc = SalesforceLocators.home;

  constructor(page: Page) {
    super(page, createLogger('SF:LoginPage'));
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  async navigate(): Promise<void> {
    this.logger.info(`Navigating to Salesforce login → ${SF_LOGIN_URL}`);
    await this.page.goto(SF_LOGIN_URL);
    await this.waitForVisible(this.loc.usernameInput);
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async enterUsername(username: string): Promise<void> {
    await this.fill(this.loc.usernameInput, username);
  }

  async enterPassword(password: string): Promise<void> {
    await this.fill(this.loc.passwordInput, password);
  }

  async clickLogin(): Promise<void> {
    await this.click(this.loc.loginButton);
  }

  /**
   * Composite action — fills credentials and submits the login form.
   */
  async login(username: string, password: string): Promise<void> {
    this.logger.info(`Logging in as: ${username}`);
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  /**
   * Verifies a successful login by waiting for the Salesforce org URL
   * and confirming the App Launcher (Lightning) or global nav is visible.
   */
  async verifyLoginSuccess(): Promise<void> {
    this.logger.info('Verifying successful Salesforce login');
    await this.page.waitForURL(POST_LOGIN_URL_PATTERN, { timeout: 45_000 });
    await this.verifyVisible(this.homeLoc.appLauncherButton, { timeout: 45_000 });
    this.logger.info(`Login successful — current URL: ${this.page.url()}`);
  }

  /**
   * Verifies the inline error message shown on failed login attempts.
   */
  async verifyErrorMessage(expectedText: string): Promise<void> {
    this.logger.info(`Verifying login error contains: "${expectedText}"`);
    await this.verifyVisible(this.loc.errorMessage);
    await this.verifyText(this.loc.errorMessage, expectedText);
  }

  /**
   * Verifies the logged-in user's name appears in the header nav.
   */
  async verifyLoggedInUser(firstName: string): Promise<void> {
    this.logger.info(`Verifying logged-in user: "${firstName}"`);
    await this.verifyText(this.homeLoc.userNavLabel, firstName, { timeout: 45_000 });
  }
}
