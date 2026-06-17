import { expect } from '@playwright/test';
import { IComparisonHelper, FieldComparison } from '../interfaces/IComparisonHelper';
import { ILogger } from '../interfaces/ILogger';
import { createLogger } from '../utils/Logger';

export class ComparisonHelper implements IComparisonHelper {
  private readonly comparisons: FieldComparison[] = [];

  constructor(
    private readonly source: string = 'Expected',
    private readonly logger: ILogger = createLogger('ComparisonHelper')
  ) {}

  // ─── Comparators ─────────────────────────────────────────────────────────────

  compare(field: string, uiValue: string, expectedValue: string, note?: string): this {
    const ui  = (uiValue ?? '').trim();
    const exp = (expectedValue ?? '').trim();
    const passed = ui === exp;
    this.record(field, ui, exp, passed, note);
    expect.soft(ui, this.label(field, note)).toBe(exp);
    return this;
  }

  compareIgnoreCase(field: string, uiValue: string, expectedValue: string, note?: string): this {
    const ui  = (uiValue ?? '').trim().toLowerCase();
    const exp = (expectedValue ?? '').trim().toLowerCase();
    const passed = ui === exp;
    this.record(field, uiValue?.trim(), expectedValue?.trim(), passed, note);
    expect.soft(ui, this.label(field, note)).toBe(exp);
    return this;
  }

  compareNumber(
    field: string,
    uiValue: string,
    expectedValue: string | number,
    note?: string
  ): this {
    const uiNum  = parseFloat((uiValue ?? '').replace(/[^0-9.-]/g, ''));
    const expNum = typeof expectedValue === 'number'
      ? expectedValue
      : parseFloat(String(expectedValue).replace(/[^0-9.-]/g, ''));
    const passed = uiNum === expNum;
    this.record(field, String(uiNum), String(expNum), passed, note);
    expect.soft(uiNum, this.label(field, note)).toBe(expNum);
    return this;
  }

  compareDate(field: string, uiValue: string, expectedValue: string, note?: string): this {
    const normalize = (v: string): string => {
      const d = new Date(v);
      return isNaN(d.getTime()) ? v.trim() : d.toISOString().slice(0, 10);
    };
    const ui  = normalize(uiValue);
    const exp = normalize(expectedValue);
    const passed = ui === exp;
    this.record(field, ui, exp, passed, note);
    expect.soft(ui, this.label(field, note)).toBe(exp);
    return this;
  }

  // ─── Reporting ───────────────────────────────────────────────────────────────

  getResults(): FieldComparison[] {
    return [...this.comparisons];
  }

  getSummary(): string {
    const passed = this.comparisons.filter(c => c.passed).length;
    const failed = this.comparisons.filter(c => !c.passed).length;
    const rows = this.comparisons.map(c => {
      const status = c.passed ? '✓' : '✗';
      const note   = c.note ? ` (${c.note})` : '';
      return `  ${status} ${c.field}${note}: UI="${c.uiValue}" | ${this.source}="${c.expectedValue}"`;
    });
    return `[ComparisonHelper] ${passed} passed, ${failed} failed\n${rows.join('\n')}`;
  }

  logSummary(): this {
    const hasFailures = this.comparisons.some(c => !c.passed);
    if (hasFailures) {
      this.logger.warn(this.getSummary());
    } else {
      this.logger.info(this.getSummary());
    }
    return this;
  }

  // ─── Internals ───────────────────────────────────────────────────────────────

  private record(
    field: string,
    uiValue: string,
    expectedValue: string,
    passed: boolean,
    note?: string
  ): void {
    this.comparisons.push({ field, uiValue, expectedValue, passed, note });
  }

  private label(field: string, note?: string): string {
    return note ? `[${this.source}] "${field}" (${note})` : `[${this.source}] "${field}"`;
  }
}
