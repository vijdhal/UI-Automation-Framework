import { expect, Locator, Page } from '@playwright/test';
import * as path from 'path';
import { IBasePage, ActionOptions, TypeOptions, WaitOptions } from '../interfaces/IBasePage';
import { ILogger } from '../interfaces/ILogger';
import { IRetryHandler } from '../interfaces/IRetryHandler';
import { createLogger } from '../utils/Logger';
import { RetryHandler } from '../utils/RetryHandler';

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_RETRIES = 3;
const DEFAULT_TYPE_DELAY = 50;
const SCREENSHOT_DIR = 'screenshots';

/**
 * Abstract base class for all page objects.
 *
 * SOLID adherence:
 *  S – each method handles one interaction concern
 *  O – subclasses extend without modifying this class
 *  L – any subclass is substitutable for BasePage
 *  I – IBasePage exposes only what page objects need; ILogger / IRetryHandler are separate contracts
 *  D – depends on ILogger and IRetryHandler abstractions, not concrete implementations
 */
export abstract class BasePage implements IBasePage {
  protected readonly page: Page;
  protected readonly logger: ILogger;
  private readonly retryHandler: IRetryHandler;

  constructor(
    page: Page,
    logger: ILogger = createLogger('BasePage'),
    retryHandler?: IRetryHandler
  ) {
    this.page = page;
    this.logger = logger;
    this.retryHandler = retryHandler ?? new RetryHandler(createLogger('RetryHandler'));
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private resolve(locator: string | Locator): Locator {
    return typeof locator === 'string' ? this.page.locator(locator) : locator;
  }

  private label(locator: string | Locator): string {
    return typeof locator === 'string' ? locator : '<Locator>';
  }

  // ─── Interactions ────────────────────────────────────────────────────────────

  async click(locator: string | Locator, options?: ActionOptions): Promise<void> {
    const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES } = options ?? {};
    const target = this.label(locator);
    this.logger.info(`click → ${target}`);

    await this.retryHandler.execute(
      async () => {
        const el = this.resolve(locator);
        await el.waitFor({ state: 'visible', timeout });
        await el.click({ timeout });
      },
      `click(${target})`,
      { retries }
    );

    this.logger.debug(`click done → ${target}`);
  }

  async fill(locator: string | Locator, value: string, options?: ActionOptions): Promise<void> {
    const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES } = options ?? {};
    const target = this.label(locator);
    this.logger.info(`fill → ${target} | value: "${value}"`);

    await this.retryHandler.execute(
      async () => {
        const el = this.resolve(locator);
        await el.waitFor({ state: 'visible', timeout });
        await el.clear();
        await el.fill(value, { timeout });
      },
      `fill(${target})`,
      { retries }
    );

    this.logger.debug(`fill done → ${target}`);
  }

  /**
   * Simulates keystroke-by-keystroke input — useful when `fill` bypasses JS event listeners.
   */
  async type(locator: string | Locator, text: string, options?: TypeOptions): Promise<void> {
    const {
      timeout = DEFAULT_TIMEOUT,
      retries = DEFAULT_RETRIES,
      delay = DEFAULT_TYPE_DELAY,
    } = options ?? {};
    const target = this.label(locator);
    this.logger.info(`type → ${target} | text: "${text}"`);

    await this.retryHandler.execute(
      async () => {
        const el = this.resolve(locator);
        await el.waitFor({ state: 'visible', timeout });
        await el.clear();
        await el.pressSequentially(text, { delay });
      },
      `type(${target})`,
      { retries }
    );

    this.logger.debug(`type done → ${target}`);
  }

  /**
   * Selects an option from a native `<select>` element by value, label, or index.
   * For custom (div-based) dropdowns, override this method in the child page object.
   */
  async selectDropdown(
    locator: string | Locator,
    value: string,
    options?: ActionOptions
  ): Promise<void> {
    const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES } = options ?? {};
    const target = this.label(locator);
    this.logger.info(`selectDropdown → ${target} | value: "${value}"`);

    await this.retryHandler.execute(
      async () => {
        const el = this.resolve(locator);
        await el.waitFor({ state: 'visible', timeout });
        await el.selectOption(value, { timeout });
      },
      `selectDropdown(${target}, "${value}")`,
      { retries }
    );

    this.logger.debug(`selectDropdown done → ${target}`);
  }

  // ─── Waits ───────────────────────────────────────────────────────────────────

  async waitForVisible(locator: string | Locator, options?: WaitOptions): Promise<void> {
    const { timeout = DEFAULT_TIMEOUT } = options ?? {};
    const target = this.label(locator);
    this.logger.info(`waitForVisible → ${target}`);
    await this.resolve(locator).waitFor({ state: 'visible', timeout });
    this.logger.debug(`element visible → ${target}`);
  }

  async waitForHidden(locator: string | Locator, options?: WaitOptions): Promise<void> {
    const { timeout = DEFAULT_TIMEOUT } = options ?? {};
    const target = this.label(locator);
    this.logger.info(`waitForHidden → ${target}`);
    await this.resolve(locator).waitFor({ state: 'hidden', timeout });
    this.logger.debug(`element hidden → ${target}`);
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  /**
   * Asserts that the element contains the expected text.
   * Uses Playwright's built-in auto-waiting via `expect`.
   */
  async verifyText(
    locator: string | Locator,
    expectedText: string,
    options?: WaitOptions
  ): Promise<void> {
    const { timeout = DEFAULT_TIMEOUT } = options ?? {};
    const target = this.label(locator);
    this.logger.info(`verifyText → ${target} | expected: "${expectedText}"`);

    const el = this.resolve(locator);
    await expect(el).toContainText(expectedText, { timeout });

    this.logger.info(`verifyText passed → "${expectedText}" found in ${target}`);
  }

  /**
   * Asserts that the element is visible in the viewport.
   * Uses Playwright's built-in auto-waiting via `expect`.
   */
  async verifyVisible(locator: string | Locator, options?: WaitOptions): Promise<void> {
    const { timeout = DEFAULT_TIMEOUT } = options ?? {};
    const target = this.label(locator);
    this.logger.info(`verifyVisible → ${target}`);

    const el = this.resolve(locator);
    await expect(el).toBeVisible({ timeout });

    this.logger.info(`verifyVisible passed → ${target}`);
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  /**
   * Captures a full-page screenshot and saves it under the `screenshots/` directory.
   * Returns the raw PNG buffer for further use (e.g. attaching to a test report).
   */
  async captureScreenshot(name?: string): Promise<Buffer> {
    const filename = `${name ?? `screenshot-${Date.now()}`}.png`;
    const filePath = path.join(SCREENSHOT_DIR, filename);
    this.logger.info(`captureScreenshot → ${filePath}`);

    const buffer = await this.page.screenshot({ path: filePath, fullPage: true });

    this.logger.info(`screenshot saved → ${filePath}`);
    return buffer;
  }

  /**
   * Sets files on a native `<input type="file">` element.
   * @param filePaths - Absolute path(s) to the file(s) to upload.
   */
  async uploadFile(locator: string | Locator, filePaths: string | string[]): Promise<void> {
    const target = this.label(locator);
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    this.logger.info(`uploadFile → ${target} | files: [${paths.join(', ')}]`);

    const el = this.resolve(locator);
    await el.setInputFiles(paths);

    this.logger.info(`uploadFile done → ${target}`);
  }
}
