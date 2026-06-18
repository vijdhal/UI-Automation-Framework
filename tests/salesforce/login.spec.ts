import { test } from '@playwright/test';
import { LoginPage } from '../../src/pages/salesforce/LoginPage';
import { yamlReader } from '../../src/utils/YamlReader';

/**
 * Salesforce Login Tests
 *
 * Test data is driven entirely from YAML — the test title is the lookup key.
 * To update credentials or user details, edit the relevant YAML files:
 *   src/testdata/yaml/credentials.yaml
 *   src/testdata/yaml/users.yaml
 */
test.describe('Salesforce Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test.afterEach(async ({ }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await loginPage.captureScreenshot(
        `FAILED_${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}`
      );
    }
  });

  // ─── Valid Login ────────────────────────────────────────────────────────────

  test('TC_SF_Login_001 - Login with valid admin credentials', async ({ }, testInfo) => {
    const cred = yamlReader.getCredential(testInfo.title);
    const user = yamlReader.getUser(testInfo.title);

    await loginPage.login(cred.username, cred.password);
    await loginPage.verifyLoginSuccess();
    await loginPage.verifyLoggedInUser(user.firstName);
  });
});
