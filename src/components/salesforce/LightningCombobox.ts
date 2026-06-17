import { Locator, Page } from '@playwright/test';

/**
 * Interacts with Salesforce `lightning-combobox` components.
 * These are NOT native <select> elements — they use custom LWC markup.
 */
export class LightningCombobox {
  constructor(
    private readonly page: Page,
    private readonly container: Locator
  ) {}

  /** Opens the dropdown and selects an option by its visible label. */
  async select(optionLabel: string): Promise<void> {
    await this.container.locator('button.slds-combobox__form-element, input[role="combobox"]').click();
    await this.page
      .locator(`lightning-base-combobox-item[data-value]:has-text("${optionLabel}")`)
      .first()
      .click();
  }

  /** Returns the currently selected label. */
  async getValue(): Promise<string> {
    return (
      await this.container
        .locator('input[readonly], .slds-combobox__form-element span')
        .first()
        .innerText()
    ).trim();
  }

  /** Returns all available option labels without selecting any. */
  async getOptions(): Promise<string[]> {
    await this.container.locator('button.slds-combobox__form-element, input[role="combobox"]').click();
    const items = await this.page.locator('lightning-base-combobox-item[data-value]').allInnerTexts();
    await this.page.keyboard.press('Escape');
    return items.map(t => t.trim());
  }
}
