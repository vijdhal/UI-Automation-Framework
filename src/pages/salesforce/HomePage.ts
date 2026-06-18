import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { SalesforceLocators } from '../../locators/SalesforceLocators';
import { createLogger } from '../../utils/Logger';
export class HomePage extends BasePage {
  private readonly loc = SalesforceLocators.home;

  constructor(page: Page) {
    super(page, createLogger('SF:HomePage'));
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    const url = `${process.env['BASE_URL'] ?? ''}/lightning/page/home`;
    this.logger.info(`Navigating to SF home → ${url}`);
    await this.page.goto(url);
    await this.waitForLoad();
  }

  async waitForLoad(): Promise<void> {
    await this.waitForVisible(this.loc.appLauncherButton, { timeout: 60_000 });
  }

  // ─── App Launcher ─────────────────────────────────────────────────────────────

  async openAppLauncher(): Promise<void> {
    await this.click(this.loc.appLauncherButton);
    await this.waitForVisible(this.loc.appLauncherSearch);
  }

  async navigateToApp(appName: string): Promise<void> {
    await this.openAppLauncher();
    await this.fill(this.loc.appLauncherSearch, appName);
    await this.click(`a.slds-app-launcher__tile-figure:has-text("${appName}")`);
    await this.waitForLoad();
  }

  // ─── Object navigation (direct URL) ──────────────────────────────────────────

  async navigateToObject(objectApiName: string): Promise<void> {
    const url = `${process.env['BASE_URL'] ?? ''}/lightning/o/${objectApiName}/list`;
    await this.page.goto(url);
    await this.waitForVisible(SalesforceLocators.list.listTitle);
  }

  async navigateToRecord(recordId: string): Promise<void> {
    const url = `${process.env['BASE_URL'] ?? ''}/lightning/r/${recordId}/view`;
    await this.page.goto(url);
    await this.waitForVisible(SalesforceLocators.record.pageTitle, { timeout: 60_000 });
  }

  // ─── Global navigation bar ────────────────────────────────────────────────────

  async clickNavItem(label: string): Promise<void> {
    await this.click(SalesforceLocators.home.navItem(label));
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async verifyLoggedInAs(firstName: string): Promise<void> {
    await this.verifyText(this.loc.userNavLabel, firstName, { timeout: 45_000 });
  }
}
