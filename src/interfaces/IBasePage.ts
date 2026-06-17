import { Locator } from '@playwright/test';

export interface ActionOptions {
  timeout?: number;
  retries?: number;
}

export interface TypeOptions extends ActionOptions {
  delay?: number;
}

export interface WaitOptions {
  timeout?: number;
}

export interface IBasePage {
  click(locator: string | Locator, options?: ActionOptions): Promise<void>;
  fill(locator: string | Locator, value: string, options?: ActionOptions): Promise<void>;
  type(locator: string | Locator, text: string, options?: TypeOptions): Promise<void>;
  selectDropdown(locator: string | Locator, value: string, options?: ActionOptions): Promise<void>;
  waitForVisible(locator: string | Locator, options?: WaitOptions): Promise<void>;
  waitForHidden(locator: string | Locator, options?: WaitOptions): Promise<void>;
  verifyText(locator: string | Locator, expectedText: string, options?: WaitOptions): Promise<void>;
  verifyVisible(locator: string | Locator, options?: WaitOptions): Promise<void>;
  captureScreenshot(name?: string): Promise<Buffer>;
  uploadFile(locator: string | Locator, filePaths: string | string[]): Promise<void>;
}
