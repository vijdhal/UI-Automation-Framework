# UI Automation Framework

Playwright + TypeScript framework for Salesforce UI and Data Cloud API validation.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Setup](#2-setup)
3. [Environment Configuration](#3-environment-configuration)
4. [Salesforce Connected App Setup](#4-salesforce-connected-app-setup)
5. [Running Tests](#5-running-tests)
6. [Sample Flow 1 — UI Login Test](#6-sample-flow-1--ui-login-test)
7. [Sample Flow 2 — Data Cloud API Validation Test](#7-sample-flow-2--data-cloud-api-validation-test)
8. [How to Create a New Test](#8-how-to-create-a-new-test)
9. [Framework Reference](#9-framework-reference)
10. [Common Issues](#10-common-issues)

---

## 1. Project Structure

```
UI-Automation-Framework/
├── src/
│   ├── api/
│   │   ├── salesforce/              # Salesforce REST API client + OAuth auth
│   │   └── datacloud/               # Data Cloud SQL query client
│   ├── fixtures/
│   │   ├── sfFixtures.ts            # Playwright fixtures (page objects + API clients)
│   │   └── salesforce/
│   │       └── sfAuth.setup.ts      # Runs once to save SF browser session
│   ├── helpers/
│   │   └── ComparisonHelper.ts      # Field-by-field soft assertion comparator
│   ├── pages/
│   │   └── salesforce/
│   │       ├── BasePage.ts          # Common Playwright actions (click, fill, wait…)
│   │       ├── LoginPage.ts         # SF login page actions + assertions
│   │       ├── HomePage.ts          # SF Lightning home + navigation
│   │       ├── RecordPage.ts        # Generic Lightning record page (fields, edit, save)
│   │       └── AccountPage.ts       # Account navigation + field reads
│   ├── testdata/
│   │   └── yaml/
│   │       ├── credentials.yaml     # Login credentials keyed by ROLE + environment
│   │       ├── users.yaml           # User profile data keyed by test case name
│   │       ├── sf-accounts.yaml     # Account test data keyed by test case name
│   │       └── environments.yaml    # Timeouts and feature flags per environment
│   └── utils/
│       ├── YamlReader.ts            # YAML loader with caching + env-aware lookup
│       └── Logger.ts                # Winston logger
├── tests/
│   └── salesforce/
│       ├── login.spec.ts            # Login test suite
│       └── account.spec.ts          # Account UI + Data Cloud validation suite
├── .env.dev                         # Dev environment variables
├── .env.qa                          # QA environment variables
├── .env.uat                         # UAT environment variables
└── playwright.config.ts             # Playwright configuration
```

---

## 2. Setup

### Prerequisites
- Node.js 18 or higher (`node --version` to check)
- Access to a Salesforce org (dev / qa / uat)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install
```

Then fill in your `.env.*` files — see the next section.

---

## 3. Environment Configuration

There is one `.env` file per environment. Fill in all values before running tests.

```ini
# .env.dev  (same structure for .env.qa and .env.uat)

# ── Salesforce org ────────────────────────────────────────────────────────────
BASE_URL=https://yourorg.my.salesforce.com

# ── Salesforce REST API + Data Cloud OAuth ────────────────────────────────────
SF_CLIENT_ID=3MVG9...                    # Connected App Consumer Key
SF_CLIENT_SECRET=XXXXXXX                 # Connected App Consumer Secret
SF_USERNAME=admin@yourorg.com            # SF login username (test user)
SF_PASSWORD=YourPassword                 # SF login password
SF_SECURITY_TOKEN=abcXXXXXX             # User security token
SF_AUTH_URL=https://login.salesforce.com/services/oauth2/token
SF_API_VERSION=v62.0

# ── Data Cloud ────────────────────────────────────────────────────────────────
SF_DC_API_VERSION=v1
```

> **Sandbox orgs**: Change `SF_AUTH_URL` to `https://test.salesforce.com/services/oauth2/token`

---

## 4. Salesforce Connected App Setup

One-time setup per org. The same Connected App is used for both the Salesforce REST API and Data Cloud.

### Step 1 — Create the Connected App

1. Go to **Setup → App Manager → New Connected App**
2. Fill in App Name and Contact Email
3. Under **API (Enable OAuth Settings)**:
   - Check **Enable OAuth Settings**
   - Callback URL: `https://login.salesforce.com/services/oauth2/success`
   - Add these OAuth scopes:

| Scope | Required for |
|---|---|
| `api` | Salesforce REST API |
| `refresh_token` | Keep sessions alive |
| `cdp_query_api` | **Data Cloud SQL queries** |

4. Save — wait 2–10 minutes to activate

### Step 2 — Get Consumer Key and Secret

- Setup → App Manager → find your app → **View**
- Copy **Consumer Key** → `SF_CLIENT_ID` in `.env.*`
- Click **Consumer Secret → Click to reveal** → `SF_CLIENT_SECRET`

### Step 3 — Get the Security Token

- Top-right avatar → **Settings → My Personal Information → Reset My Security Token**
- Salesforce emails it to you → paste into `SF_SECURITY_TOKEN`

> If the machine's IP is in Salesforce **Trusted IP Ranges** (Setup → Security → Network Access), the security token is not required.

### Step 4 — Update credentials.yaml

Open `src/testdata/yaml/credentials.yaml` and fill in the real usernames and passwords for each role and environment.

---

## 5. Running Tests

```bash
# All tests — dev / qa / uat
npm run test:dev
npm run test:qa
npm run test:uat

# With browser visible
npm run test:dev:headed

# Specific test by name
npm run test:dev -- --grep "TC_SF_Login_001"

# Specific project only
npm run test:dev -- --project=sf-chromium

# View HTML report after run
npm run report
```

### How projects work

| Project | What it runs | Uses saved login? |
|---|---|---|
| `sf-setup` | Logs in once and saves session to `.auth/sf-admin.json` | No |
| `sf-chromium` | All tests in `tests/salesforce/` | Yes |
| `chromium` / `firefox` / `webkit` | Non-SF tests | No |

`sf-setup` always runs first automatically. All SF tests start already logged in.

---

## 6. Sample Flow 1 — UI Login Test

This flow opens the Salesforce login page, enters credentials by role, and verifies the correct user lands on the home page.

### File 1 — `credentials.yaml` (role-keyed, env-aware)

```yaml
# src/testdata/yaml/credentials.yaml
admin:
  dev:
    username: admin@yourorg.com
    password: "DevPassword!"
  qa:
    username: admin@yourorg-qa.com
    password: "QAPassword!"
  uat:
    username: admin@yourorg-uat.com
    password: "UATPassword!"

standard:
  dev:
    username: user@yourorg.com
    password: "DevPassword!"
```

No need to duplicate credentials per test. All tests that need `admin` point to the same entry. The correct env block is picked automatically based on `ENV`.

### File 2 — `users.yaml` (test-case-keyed, env-aware)

```yaml
# src/testdata/yaml/users.yaml
TC_SF_Login_001 - Login with valid admin credentials:
  dev:
    id: sf_admin_dev
    firstName: Sarah
    lastName: Connor
    email: admin@yourorg.com
    role: admin
  qa:
    id: sf_admin_qa
    firstName: Sarah
    lastName: Connor
    email: admin@yourorg-qa.com
    role: admin
```

### File 3 — `login.spec.ts`

```typescript
// tests/salesforce/login.spec.ts
import { test }       from '@playwright/test';
import { LoginPage }  from '../../src/pages/salesforce/LoginPage';
import { yamlReader } from '../../src/utils/YamlReader';

test.describe('Salesforce Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();          // opens https://login.salesforce.com
  });

  test.afterEach(async ({ }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await loginPage.captureScreenshot(`FAILED_${testInfo.title.replace(/\W/g, '_')}`);
    }
  });

  test('TC_SF_Login_001 - Login with valid admin credentials', async ({ }, testInfo) => {
    // 1. Get credentials by role — picks dev/qa/uat block automatically
    const cred = yamlReader.getCredentialByRole('admin');

    // 2. Get expected user details by test title — picks the right env block
    const user = yamlReader.getUser(testInfo.title);

    // 3. Login and verify
    await loginPage.login(cred.username, cred.password);
    await loginPage.verifyLoginSuccess();           // waits for Lightning home
    await loginPage.verifyLoggedInUser(user.firstName); // checks header nav
  });
});
```

### End-to-end flow

```
credentials.yaml
  admin → dev → username / password
                      ↓
          loginPage.login(username, password)
          Playwright fills the login form and submits
                      ↓
          verifyLoginSuccess()
          Waits for *.salesforce.com redirect + App Launcher visible
                      ↓
users.yaml
  TC_SF_Login_001 → dev → firstName: "Sarah"
                      ↓
          verifyLoggedInUser("Sarah")
          Checks the user's name appears in the header nav
```

---

## 7. Sample Flow 2 — Data Cloud API Validation Test

This flow verifies that what the **UI shows** on a Salesforce Account record matches what **Data Cloud has ingested** — proving data sync is working end-to-end.

### How Data Cloud queries work

```
POST https://<org>/api/v1/query
Body: { "sql": "SELECT Name, Phone__c FROM Account__dlm WHERE Id__c = '001XX...' LIMIT 1" }

Response:
{
  "data": [{ "Name": "Acme Corp", "Phone__c": "+1 415 555 1234" }],
  "rowCount": 1,
  "processingTime": 42
}
```

The framework sends this request automatically when you call `dcApi.query(sql)`.

> **Why field names differ**: Data Cloud stores CRM fields with a `__c` suffix in its own tables (`Account__dlm`). So `Phone` in Salesforce CRM becomes `Phone__c` in Data Cloud.

### File 1 — `sf-accounts.yaml`

```yaml
# src/testdata/yaml/sf-accounts.yaml

# UI vs Salesforce REST API
TC_SF_Account_001 - Verify Account UI fields match Salesforce Object:
  accountId: 001XXXXXXXXXXXXXXXXX      # replace with a real Account Id from your org
  compareFields:
    - Name
    - Phone
    - Website
    - Industry
    - Type

# UI vs Data Cloud
TC_SF_Account_002 - Verify Account UI fields match Data Cloud:
  accountId: 001XXXXXXXXXXXXXXXXX
  dataCloudTable: Account__dlm         # Data Cloud table name for Account
  compareFields:
    - Name
    - Phone__c                         # Data Cloud field names use __c suffix
    - Industry__c
```

> **Finding the Account Id**: Open the Account in Salesforce → copy from the URL:
> `https://yourorg.lightning.force.com/lightning/r/Account/001XXXXXXXXXXXXXXXXX/view`

### File 2 — `account.spec.ts`

```typescript
// tests/salesforce/account.spec.ts
import { test, expect }  from '../../src/fixtures/sfFixtures';
import { yamlReader }    from '../../src/utils/YamlReader';
import { SfAccount }     from '../../src/interfaces/salesforce.types';
import * as path         from 'path';

const SF_ACCOUNTS_YAML = path.resolve('src/testdata/yaml/sf-accounts.yaml');

interface AccountTestData {
  accountId:       string;
  compareFields:   (keyof SfAccount)[];
  dataCloudTable?: string;
}

function getTestData(testTitle: string): AccountTestData {
  return yamlReader.get<AccountTestData>(testTitle, SF_ACCOUNTS_YAML);
}

test.describe('Salesforce Account', () => {

  // ── TC1: UI vs Salesforce REST API ────────────────────────────────────────
  test('TC_SF_Account_001 - Verify Account UI fields match Salesforce Object',
    async ({ accountPage, sfApi, comparator }, testInfo) => {

      const { accountId, compareFields } = getTestData(testInfo.title);

      // 1. Read what the UI shows
      await accountPage.navigateById(accountId);
      const uiSnapshot = await accountPage.getFieldValues(compareFields as string[]);

      // 2. Fetch the same fields from Salesforce REST API (source of truth)
      const apiRecord = await sfApi.getRecord<SfAccount>(
        'Account', accountId, compareFields as string[]
      );

      // 3. Compare field by field — soft assertions (all mismatches shown at once)
      comparator
        .compare('Name',    uiSnapshot['Name'],    apiRecord.Name    ?? '')
        .compare('Phone',   uiSnapshot['Phone'],   apiRecord.Phone   ?? '')
        .compare('Website', uiSnapshot['Website'], apiRecord.Website ?? '')
        .compareIgnoreCase('Industry', uiSnapshot['Industry'], apiRecord.Industry ?? '')
        .compareIgnoreCase('Type',     uiSnapshot['Type'],     apiRecord.Type     ?? '')
        .logSummary();
    }
  );

  // ── TC2: UI vs Data Cloud SQL query ──────────────────────────────────────
  test('TC_SF_Account_002 - Verify Account UI fields match Data Cloud',
    async ({ accountPage, dcApi, comparator }, testInfo) => {

      const { accountId, dataCloudTable, compareFields } = getTestData(testInfo.title);
      if (!dataCloudTable) throw new Error('dataCloudTable is required for this test');

      // 1. Read what the UI shows
      await accountPage.navigateById(accountId);
      const uiSnapshot = await accountPage.getFieldValues(compareFields as string[]);

      // 2. Query Data Cloud — POST /api/v1/query with SQL
      const sql = `
        SELECT ${compareFields.join(', ')}
        FROM   ${dataCloudTable}
        WHERE  Id__c = '${accountId}'
        LIMIT  1
      `;
      const dcRows = await dcApi.query<Record<string, string>>(sql);
      expect(dcRows.length, `No Data Cloud row found for Account ${accountId}`).toBe(1);
      const dcRecord = dcRows[0]!;

      // 3. Compare UI vs Data Cloud
      comparator
        .compare('Name',    uiSnapshot['Name'],  dcRecord['Name']        ?? '')
        .compare('Phone',   uiSnapshot['Phone'], dcRecord['Phone__c']    ?? '')
        .compareIgnoreCase('Industry', uiSnapshot['Industry'], dcRecord['Industry__c'] ?? '')
        .logSummary();
    }
  );

});
```

### End-to-end flow

```
sf-accounts.yaml
  accountId, compareFields, dataCloudTable
             │
    ┌────────┴────────────────────────────────┐
    ▼                                         ▼
accountPage.navigateById()           dcApi.query(SQL)
Playwright opens the record     POST /api/v1/query → Data Cloud
page and scrapes field values   returns rows from Account__dlm
    │                                         │
    └────────────────┬────────────────────────┘
                     ▼
        comparator.compare(field, uiValue, dcValue)
        Soft assertions — all fields checked,
        full mismatch report shown at end of test

Result logged:
  ✓ Name:     UI="Acme Corp"   | Expected="Acme Corp"
  ✓ Phone:    UI="+1 415..."   | Expected="+1 415..."
  ✗ Industry: UI="Technology"  | Expected="tech"   ← fails here
```

### ComparisonHelper methods

| Method | Use when |
|---|---|
| `.compare(field, uiVal, expectedVal)` | Exact string match |
| `.compareIgnoreCase(field, uiVal, expectedVal)` | Case-insensitive match |
| `.compareNumber(field, uiVal, expectedVal)` | Numeric comparison (strips formatting) |
| `.compareDate(field, uiVal, expectedVal)` | Date match (normalises to YYYY-MM-DD) |

---

## 8. How to Create a New Test

Follow these 3 steps for any new test module (e.g. Customer 360, Contacts, Orders).

### Step 1 — Create a YAML file for test data

```yaml
# src/testdata/yaml/customer360.yaml
TC_C360_001 - Verify Customer 360 profile matches Data Cloud:
  customerId: CUST-XXXXXXXXX
  dataCloudTable: Individual__dlm
  compareFields:
    - FirstName__c
    - LastName__c
    - Email__c
```

### Step 2 — Write the test

```typescript
// tests/salesforce/customer360.spec.ts
import { test, expect } from '../../src/fixtures/sfFixtures';
import { yamlReader }   from '../../src/utils/YamlReader';
import * as path        from 'path';

const C360_YAML = path.resolve('src/testdata/yaml/customer360.yaml');

interface C360TestData {
  customerId:    string;
  dataCloudTable: string;
  compareFields: string[];
}

test.describe('Customer 360', () => {

  test('TC_C360_001 - Verify Customer 360 profile matches Data Cloud',
    async ({ dcApi, comparator }, testInfo) => {

      const { customerId, dataCloudTable, compareFields } = yamlReader.get<C360TestData>(
        testInfo.title, C360_YAML
      );

      const sql = `
        SELECT ${compareFields.join(', ')}
        FROM   ${dataCloudTable}
        WHERE  Id__c = '${customerId}'
        LIMIT  1
      `;
      const rows = await dcApi.query<Record<string, string>>(sql);
      expect(rows.length).toBe(1);
      const record = rows[0]!;

      comparator
        .compare('FirstName', record['FirstName__c'] ?? '', 'Expected First Name')
        .compare('Email',     record['Email__c']     ?? '', 'Expected Email')
        .logSummary();
    }
  );
});
```

### Step 3 — Run it

```bash
npm run test:dev -- --grep "TC_C360_001" --headed
```

### Rules to remember

| Rule | Why |
|---|---|
| YAML key = exact test title | `yamlReader.get(testInfo.title, file)` uses this as the lookup key |
| Credentials use role, not test name | `getCredentialByRole('admin')` — one entry reused by all tests |
| No changes to `YamlReader.ts` needed | `yamlReader.get<T>(key, file)` works for any YAML file |
| Data Cloud fields use `__c` suffix | `Phone__c`, `Industry__c` — check your Data Cloud schema |

---

## 9. Framework Reference

### Available fixtures (`sfFixtures.ts`)

Import `test` from `sfFixtures` instead of `@playwright/test` to get these injected automatically:

```typescript
import { test, expect } from '../../src/fixtures/sfFixtures';

test('my test', async ({ accountPage, sfApi, dcApi, comparator }) => { ... });
```

| Fixture | What you get |
|---|---|
| `loginPage` | LoginPage — navigate, login, verify |
| `homePage` | HomePage — auto-navigated to SF home on injection |
| `recordPage` | RecordPage — generic record field reads |
| `accountPage` | AccountPage — navigate by ID, read Account fields |
| `sfApi` | SalesforceApiClient — query, getRecord, getRecordsByField |
| `dcApi` | DataCloudApiClient — query Data Cloud via SQL |
| `comparator` | ComparisonHelper — soft field-by-field comparison |

### YamlReader methods

```typescript
import { yamlReader } from '../../src/utils/YamlReader';

// Get credentials by role (auto-picks env from ENV variable)
const cred = yamlReader.getCredentialByRole('admin');
// → { username: '...', password: '...' }

// Get user profile by test title (auto-picks env)
const user = yamlReader.getUser(testInfo.title);
// → { firstName: 'Sarah', lastName: 'Connor', role: 'admin', ... }

// Get any data from any YAML file
const data = yamlReader.get<MyType>(testInfo.title, path.resolve('src/testdata/yaml/myfile.yaml'));
```

### credentials.yaml — role-based

```yaml
# One entry per role per environment — shared by all tests
admin:
  dev:
    username: admin@dev.org
    password: "DevPass!"
  qa:
    username: admin@qa.org
    password: "QAPass!"

invalid:
  dev:
    username: wrong@example.com
    password: "WrongPass"
```

### users.yaml — test-case-based

```yaml
# One entry per test title — can be flat or env-keyed
TC_SF_Login_001 - Login with valid admin credentials:
  dev:
    id: sf_admin_dev
    firstName: Sarah
    lastName: Connor
    email: admin@dev.org
    role: admin
```

---

## 10. Common Issues

### "SF_USERNAME and SF_PASSWORD must be set"
Open `.env.dev` and fill in `SF_USERNAME` and `SF_PASSWORD`.

---

### "No credentials for role X in credentials.yaml"
Open `src/testdata/yaml/credentials.yaml` and add the missing role with `dev`, `qa`, `uat` blocks.

---

### "element not found" on a Lightning field
The field API name in your test doesn't match Salesforce.
Check: **Setup → Object Manager → [Object] → Fields & Relationships**.

---

### YAML key mismatch error
```
Key "TC_SF_Account_001 - ..." not found in sf-accounts.yaml
```
The test title and YAML key must match **exactly** — same spacing, punctuation, and capitalisation. Copy `testInfo.title` from a debug log and paste it as the YAML key.

---

### Data Cloud returns 403 Forbidden
The Connected App is missing the `cdp_query_api` OAuth scope.
Go to **Setup → App Manager → [your app] → Edit → OAuth Scopes** and add `cdp_query_api`. Wait 2–10 minutes after saving.

---

### "SF API 401 Unauthorized"
The access token is invalid. Verify `SF_CLIENT_ID`, `SF_CLIENT_SECRET`, and `SF_SECURITY_TOKEN` in `.env.*`.
Regenerate the token: **Setup → My Personal Information → Reset My Security Token**.

---

### Test passes locally but fails in CI
The CI server IP is not in Salesforce Trusted IP Ranges, triggering MFA.
Add the CI server outbound IP to: **Setup → Security → Network Access → Trusted IP Ranges**.
