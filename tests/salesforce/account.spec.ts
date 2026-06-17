import { test, expect }         from '../../src/fixtures/sfFixtures';
import { yamlReader }            from '../../src/utils/YamlReader';
import { SfAccount }             from '../../src/interfaces/salesforce.types';
import * as path                 from 'path';

const SF_ACCOUNTS_YAML = path.resolve('src/testdata/yaml/sf-accounts.yaml');

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccountTestData {
  accountId:      string;
  compareFields:  (keyof SfAccount)[];
  dataCloudTable?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTestData(testTitle: string): AccountTestData {
  return yamlReader.get<AccountTestData>(testTitle, SF_ACCOUNTS_YAML);
}

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe('Salesforce Account', () => {

  /**
   * TC_SF_Account_001 — UI vs Salesforce Object (SOQL)
   *
   * 1. Navigate to the Account record page in Lightning
   * 2. Read the displayed field values as-is (UI snapshot)
   * 3. Fetch the same fields from Salesforce REST API (source of truth)
   * 4. Compare every field with soft assertions — all mismatches surface in one run
   */
  test('TC_SF_Account_001 - Verify Account UI fields match Salesforce Object',
    async ({ accountPage, sfApi, comparator }, testInfo) => {

      const { accountId, compareFields } = getTestData(testInfo.title);

      // ── 1. UI snapshot ─────────────────────────────────────────────────────
      await accountPage.navigateById(accountId);
      const uiSnapshot = await accountPage.getFieldValues(compareFields as string[]);

      // ── 2. API source of truth ─────────────────────────────────────────────
      const apiRecord = await sfApi.getRecord<SfAccount>(
        'Account',
        accountId,
        compareFields as string[]
      );

      // ── 3. Field-by-field comparison ───────────────────────────────────────
      comparator
        .compare('Name',     uiSnapshot['Name'],     apiRecord.Name     ?? '')
        .compare('Phone',    uiSnapshot['Phone'],    apiRecord.Phone    ?? '')
        .compare('Website',  uiSnapshot['Website'],  apiRecord.Website  ?? '')
        .compareIgnoreCase('Industry', uiSnapshot['Industry'], apiRecord.Industry ?? '')
        .compareIgnoreCase('Type',     uiSnapshot['Type'],     apiRecord.Type     ?? '')
        .logSummary();
    }
  );

  /**
   * TC_SF_Account_002 — UI vs Salesforce Data Cloud (SQL)
   *
   * Same page object as above, but the expected values come from
   * a Data Cloud query instead of the CRM REST API.
   * Useful when Data Cloud is the downstream consumer of CRM data
   * and you need to verify sync fidelity.
   */
  test('TC_SF_Account_002 - Verify Account UI fields match Data Cloud',
    async ({ accountPage, dcApi, comparator }, testInfo) => {

      const { accountId, dataCloudTable, compareFields } = getTestData(testInfo.title);

      if (!dataCloudTable) throw new Error('dataCloudTable is required for this test');

      // ── 1. UI snapshot ─────────────────────────────────────────────────────
      await accountPage.navigateById(accountId);
      const uiSnapshot = await accountPage.getFieldValues(compareFields as string[]);

      // ── 2. Data Cloud source of truth ──────────────────────────────────────
      const sql = `
        SELECT ${compareFields.join(', ')}
        FROM   ${dataCloudTable}
        WHERE  Id__c = '${accountId}'
        LIMIT  1
      `;
      const dcRows = await dcApi.query<Record<string, string>>(sql);

      expect(dcRows.length, `No Data Cloud row found for Account ${accountId}`).toBe(1);
      const dcRecord = dcRows[0]!;

      // ── 3. Field-by-field comparison ───────────────────────────────────────
      comparator
        .compare('Name',         uiSnapshot['Name'],       dcRecord['Name']         ?? '')
        .compare('Phone',        uiSnapshot['Phone'],      dcRecord['Phone__c']     ?? '')
        .compareIgnoreCase('Industry', uiSnapshot['Industry'], dcRecord['Industry__c'] ?? '')
        .logSummary();
    }
  );

});
