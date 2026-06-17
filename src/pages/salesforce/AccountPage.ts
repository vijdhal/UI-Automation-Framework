import { Page } from '@playwright/test';
import { RecordPage } from './RecordPage';
import { createLogger } from '../../utils/Logger';
import { SfAccount } from '../../interfaces/salesforce.types';
import { configManager } from '../../config/ConfigManager';

const ACCOUNT_FIELDS: (keyof SfAccount)[] = [
  'Name', 'Phone', 'Website', 'Industry', 'Type',
  'AnnualRevenue', 'NumberOfEmployees',
  'BillingCity', 'BillingState', 'BillingCountry',
];

export class AccountPage extends RecordPage {
  constructor(page: Page) {
    super(page, 'SF:AccountPage');
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  async navigateById(accountId: string): Promise<void> {
    const url = `${configManager.getBaseUrl()}/lightning/r/Account/${accountId}/view`;
    this.logger.info(`Navigate to Account → ${accountId}`);
    await this.page.goto(url);
    await this.waitForLoad();
  }

  // ─── Typed field reads ────────────────────────────────────────────────────────

  async getName(): Promise<string>     { return this.getFieldValue('Name'); }
  async getPhone(): Promise<string>    { return this.getFieldValue('Phone'); }
  async getWebsite(): Promise<string>  { return this.getFieldValue('Website'); }
  async getIndustry(): Promise<string> { return this.getFieldValue('Industry'); }
  async getType(): Promise<string>     { return this.getFieldValue('Type'); }

  async getBillingAddress(): Promise<string> {
    return this.getFieldValue('BillingAddress');
  }

  /** Reads all standard Account fields in one shot. */
  async getAccountSnapshot(): Promise<Record<string, string>> {
    return this.getFieldValues(ACCOUNT_FIELDS as string[]);
  }
}
