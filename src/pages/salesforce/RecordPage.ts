import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { SalesforceLocators } from '../../locators/SalesforceLocators';
import { LightningRecordForm } from '../../components/salesforce/LightningRecordForm';
import { createLogger } from '../../utils/Logger';
import { UiFieldMap } from '../../interfaces/salesforce.types';

const loc = SalesforceLocators.record;

/**
 * Generic Salesforce Lightning record page.
 * AccountPage extends this for typed field access.
 */
export class RecordPage extends BasePage {
  protected readonly form: LightningRecordForm;

  constructor(page: Page, loggerContext = 'SF:RecordPage') {
    super(page, createLogger(loggerContext));
    this.form = new LightningRecordForm(page);
  }

  // ─── State ───────────────────────────────────────────────────────────────────

  async waitForLoad(): Promise<void> {
    await this.waitForVisible(loc.pageTitle, { timeout: 60_000 });
  }

  async getPageTitle(): Promise<string> {
    return (await this.page.locator(loc.pageTitle).innerText()).trim();
  }

  // ─── Field reading ────────────────────────────────────────────────────────────

  async getFieldValue(fieldApiName: string): Promise<string> {
    this.logger.debug(`getFieldValue → ${fieldApiName}`);
    return this.form.getFieldValue(fieldApiName);
  }

  async getFieldValues(fieldApiNames: string[]): Promise<UiFieldMap> {
    this.logger.info(`getFieldValues → [${fieldApiNames.join(', ')}]`);
    return this.form.getFieldValues(fieldApiNames);
  }

  async getAllFieldValues(): Promise<UiFieldMap> {
    this.logger.info('getAllFieldValues');
    return this.form.getAllFieldValues();
  }

  // ─── Edit mode ───────────────────────────────────────────────────────────────

  async clickEdit(): Promise<void> {
    await this.click(loc.editButton);
  }

  async clickSave(): Promise<void> {
    await this.click(loc.saveButton);
    await this.waitForLoad();
  }

  async clickCancel(): Promise<void> {
    await this.click(loc.cancelButton);
  }

  async setFieldValue(fieldApiName: string, value: string): Promise<void> {
    await this.fill(loc.inputField(fieldApiName), value);
  }

  // ─── Related tabs ─────────────────────────────────────────────────────────────

  async clickRelatedTab(tabLabel: string): Promise<void> {
    await this.click(loc.relatedTabButton(tabLabel));
  }
}
