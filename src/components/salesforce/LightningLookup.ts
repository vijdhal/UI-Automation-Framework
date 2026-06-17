import { Locator, Page } from '@playwright/test';

/**
 * Interacts with Salesforce `lightning-lookup` (relationship lookup) fields.
 */
export class LightningLookup {
  constructor(
    private readonly page: Page,
    private readonly container: Locator
  ) {}

  /** Types a search term and selects the matching option from the dropdown. */
  async search(searchTerm: string, optionText?: string): Promise<void> {
    const input = this.container.locator('input[type="text"]');
    await input.click();
    await input.fill(searchTerm);

    // Wait for the dropdown to populate
    await this.page.locator('lightning-base-combobox-item').first().waitFor({ timeout: 15_000 });

    const target = optionText ?? searchTerm;
    await this.page
      .locator(`lightning-base-combobox-item:has-text("${target}")`)
      .first()
      .click();
  }

  /** Clears the currently selected value (removes the pill). */
  async clear(): Promise<void> {
    const pill = this.container.locator('.slds-pill__remove');
    if (await pill.isVisible()) {
      await pill.click();
    }
  }

  /** Returns the label of the currently selected record. */
  async getValue(): Promise<string> {
    const pill = this.container.locator('.slds-pill__label');
    if (await pill.isVisible()) {
      return (await pill.innerText()).trim();
    }
    return (await this.container.locator('input[type="text"]').inputValue()).trim();
  }
}
