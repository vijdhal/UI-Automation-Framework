import { Locator } from '@playwright/test';

/**
 * Reads data from Salesforce `lightning-datatable` components.
 */
export class LightningDataTable {
  constructor(private readonly container: Locator) {}

  /** Total number of data rows (excludes header). */
  async getRowCount(): Promise<number> {
    return this.container.locator('tbody tr[data-row-key-value]').count();
  }

  /** Returns the text of a specific cell identified by row index (0-based) and column label. */
  async getCellValue(rowIndex: number, columnLabel: string): Promise<string> {
    const row = this.container.locator('tbody tr[data-row-key-value]').nth(rowIndex);
    return (await row.locator(`td[data-label="${columnLabel}"]`).innerText()).trim();
  }

  /** Returns all visible column headers. */
  async getColumnHeaders(): Promise<string[]> {
    const headers = await this.container
      .locator('thead th[scope="col"] .slds-th__action span')
      .allInnerTexts();
    return headers.map(h => h.trim()).filter(Boolean);
  }

  /** Returns all cell values for a given row as label → value map. */
  async getRowData(rowIndex: number): Promise<Record<string, string>> {
    const row = this.container.locator('tbody tr[data-row-key-value]').nth(rowIndex);
    const cells = await row.locator('td[data-label]').all();
    const result: Record<string, string> = {};
    await Promise.all(
      cells.map(async cell => {
        const label = (await cell.getAttribute('data-label')) ?? '';
        result[label] = (await cell.innerText()).trim();
      })
    );
    return result;
  }

  /** Returns all rows as an array of label → value maps. */
  async getAllRows(): Promise<Record<string, string>[]> {
    const count = await this.getRowCount();
    const rows: Record<string, string>[] = [];
    for (let i = 0; i < count; i++) {
      rows.push(await this.getRowData(i));
    }
    return rows;
  }

  /** Finds the first row where a specific column matches a value. */
  async findRow(columnLabel: string, value: string): Promise<Record<string, string> | null> {
    const rows = await this.getAllRows();
    return rows.find(r => r[columnLabel]?.trim() === value) ?? null;
  }
}
