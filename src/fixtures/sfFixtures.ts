import { test as base, expect } from '@playwright/test';
import { LoginPage }      from '../pages/salesforce/LoginPage';
import { HomePage }       from '../pages/salesforce/HomePage';
import { RecordPage }     from '../pages/salesforce/RecordPage';
import { AccountPage }    from '../pages/salesforce/AccountPage';
import { ComparisonHelper } from '../helpers/ComparisonHelper';
import { getSalesforceApiClient } from '../api/salesforce/SalesforceApiClient';
import { getDataCloudApiClient }  from '../api/datacloud/DataCloudApiClient';
import { SalesforceApiClient }    from '../api/salesforce/SalesforceApiClient';
import { DataCloudApiClient }     from '../api/datacloud/DataCloudApiClient';

/** All fixture types injected into SF tests. */
type SfFixtures = {
  loginPage:   LoginPage;
  homePage:    HomePage;
  recordPage:  RecordPage;
  accountPage: AccountPage;
  sfApi:       SalesforceApiClient;
  dcApi:       DataCloudApiClient;
  comparator:  ComparisonHelper;
};

/**
 * Extended Playwright test with Salesforce page objects and API clients.
 *
 * Usage:
 *   import { test, expect } from '../../src/fixtures/sfFixtures';
 *
 *   test('verify account', async ({ accountPage, sfApi, comparator }) => { ... });
 */
export const test = base.extend<SfFixtures>({

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  homePage: async ({ page }, use) => {
    const hp = new HomePage(page);
    await hp.goto();
    await use(hp);
  },

  recordPage: async ({ page }, use) => {
    await use(new RecordPage(page));
  },

  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },

  sfApi: async ({}, use) => {
    await use(getSalesforceApiClient());
  },

  dcApi: async ({}, use) => {
    await use(getDataCloudApiClient());
  },

  comparator: async ({}, use) => {
    await use(new ComparisonHelper('SF Object'));
  },

});

export { expect };
