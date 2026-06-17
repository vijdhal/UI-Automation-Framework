import { Page } from '@playwright/test';
import { RecordPage } from './RecordPage';
import { createLogger } from '../../utils/Logger';
import { SfOpportunity } from '../../interfaces/salesforce.types';
import { configManager } from '../../config/ConfigManager';

const OPPORTUNITY_FIELDS: (keyof SfOpportunity)[] = [
  'Name', 'StageName', 'CloseDate', 'Amount',
  'Probability', 'Type', 'LeadSource', 'AccountId',
];

export class OpportunityPage extends RecordPage {
  constructor(page: Page) {
    super(page, 'SF:OpportunityPage');
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  async navigateById(opportunityId: string): Promise<void> {
    const url = `${configManager.getBaseUrl()}/lightning/r/Opportunity/${opportunityId}/view`;
    this.logger.info(`Navigate to Opportunity → ${opportunityId}`);
    await this.page.goto(url);
    await this.waitForLoad();
  }

  // ─── Typed field reads ────────────────────────────────────────────────────────

  async getName(): Promise<string>        { return this.getFieldValue('Name'); }
  async getStage(): Promise<string>       { return this.getFieldValue('StageName'); }
  async getCloseDate(): Promise<string>   { return this.getFieldValue('CloseDate'); }
  async getAmount(): Promise<string>      { return this.getFieldValue('Amount'); }
  async getProbability(): Promise<string> { return this.getFieldValue('Probability'); }
  async getAccountName(): Promise<string> { return this.getFieldValue('AccountId'); }

  /** Reads all standard Opportunity fields in one shot. */
  async getOpportunitySnapshot(): Promise<Record<string, string>> {
    return this.getFieldValues(OPPORTUNITY_FIELDS as string[]);
  }
}
