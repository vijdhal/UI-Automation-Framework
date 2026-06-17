import { Page } from '@playwright/test';
import { RecordPage } from './RecordPage';
import { createLogger } from '../../utils/Logger';
import { SfContact } from '../../interfaces/salesforce.types';
import { configManager } from '../../config/ConfigManager';

const CONTACT_FIELDS: (keyof SfContact)[] = [
  'FirstName', 'LastName', 'Email', 'Phone', 'MobilePhone',
  'Title', 'Department', 'AccountId',
  'MailingCity', 'MailingState', 'MailingCountry',
];

export class ContactPage extends RecordPage {
  constructor(page: Page) {
    super(page, 'SF:ContactPage');
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  async navigateById(contactId: string): Promise<void> {
    const url = `${configManager.getBaseUrl()}/lightning/r/Contact/${contactId}/view`;
    this.logger.info(`Navigate to Contact → ${contactId}`);
    await this.page.goto(url);
    await this.waitForLoad();
  }

  // ─── Typed field reads ────────────────────────────────────────────────────────

  async getFirstName(): Promise<string>  { return this.getFieldValue('FirstName'); }
  async getLastName(): Promise<string>   { return this.getFieldValue('LastName'); }
  async getEmail(): Promise<string>      { return this.getFieldValue('Email'); }
  async getPhone(): Promise<string>      { return this.getFieldValue('Phone'); }
  async getTitle(): Promise<string>      { return this.getFieldValue('Title'); }
  async getAccountName(): Promise<string>{ return this.getFieldValue('AccountId'); }

  async getFullName(): Promise<string> {
    const [first, last] = await Promise.all([this.getFirstName(), this.getLastName()]);
    return `${first} ${last}`.trim();
  }

  /** Reads all standard Contact fields in one shot. */
  async getContactSnapshot(): Promise<Record<string, string>> {
    return this.getFieldValues(CONTACT_FIELDS as string[]);
  }
}
