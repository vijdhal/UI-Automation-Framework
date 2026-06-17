export interface FieldComparison {
  field: string;
  uiValue: string;
  expectedValue: string;
  passed: boolean;
  note?: string;
}

export interface IComparisonHelper {
  /** Strict equality comparison (both values trimmed). */
  compare(field: string, uiValue: string, expectedValue: string, note?: string): this;

  /** Case-insensitive equality comparison. */
  compareIgnoreCase(field: string, uiValue: string, expectedValue: string, note?: string): this;

  /** Numeric comparison (both coerced to number). */
  compareNumber(field: string, uiValue: string, expectedValue: string | number, note?: string): this;

  /** Date comparison — normalises both values to ISO date string (YYYY-MM-DD). */
  compareDate(field: string, uiValue: string, expectedValue: string, note?: string): this;

  /** All recorded comparisons. */
  getResults(): FieldComparison[];

  /** One-line pass/fail summary. */
  getSummary(): string;

  /** Logs the full comparison table via the injected logger. */
  logSummary(): this;
}
