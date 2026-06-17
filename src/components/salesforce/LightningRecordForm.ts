import { Locator, Page } from '@playwright/test';

/**
 * Reads field values from a Salesforce Lightning record detail page.
 * Works with `lightning-output-field` elements rendered in view mode.
 *
 * SF Lightning renders each field as:
 *   <lightning-output-field field-name="Name">
 *     <div class="slds-form-element__static">Acme Corp</div>
 *   </lightning-output-field>
 */
export class LightningRecordForm {
  constructor(private readonly page: Page) {}

  /** Returns the visible text value of a field by its API name. */
  async getFieldValue(fieldApiName: string): Promise<string> {
    const locator = this.page
      .locator(`lightning-output-field[field-name="${fieldApiName}"]`)
      .locator('.slds-form-element__static, .slds-form-element__control')
      .first();

    await locator.waitFor({ state: 'visible', timeout: 30_000 });
    return (await locator.innerText()).trim();
  }

  /** Returns a map of field API name → visible value for a list of fields. */
  async getFieldValues(fieldApiNames: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    await Promise.all(
      fieldApiNames.map(async field => {
        result[field] = await this.getFieldValue(field);
      })
    );
    return result;
  }

  /** Returns ALL output fields visible on the page as a map. */
  async getAllFieldValues(): Promise<Record<string, string>> {
    const fields = await this.page.locator('lightning-output-field[field-name]').all();
    const result: Record<string, string> = {};
    await Promise.all(
      fields.map(async f => {
        const name = await f.getAttribute('field-name') ?? '';
        const value = await f
          .locator('.slds-form-element__static, .slds-form-element__control')
          .first()
          .innerText()
          .catch(() => '');
        result[name] = value.trim();
      })
    );
    return result;
  }

  /** Returns the value of a field label on the classic detail view (non-LWC). */
  async getDetailViewValue(labelText: string): Promise<string> {
    return this.page
      .locator(`td.dataCol:near(td.labelCol:has-text("${labelText}"))`)
      .first()
      .innerText();
  }
}
