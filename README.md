# Salesforce UI Automation Framework — Tester's Guide

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Configuration](#3-configuration)
4. [Project Structure](#4-project-structure)
5. [Source Folder Reference (`src/`)](#5-source-folder-reference-src)
6. [Test Data (YAML Files)](#6-test-data-yaml-files)
7. [Running Tests](#7-running-tests)
8. [Reports](#8-reports)
9. [Writing a New Test](#9-writing-a-new-test)
10. [Common Issues](#10-common-issues)

---

## 1. Prerequisites

Install the following tools before setting up the framework.

| Tool | Version | Download |
|---|---|---|
| Node.js | 18 or higher | https://nodejs.org |
| VS Code | Latest | https://code.visualstudio.com |
| Git | Latest | https://git-scm.com |

Verify your installation by opening a terminal and running:

```bash
node --version   # should print v18.x.x or higher
npm --version    # should print 9.x.x or higher
```

---

## 2. Installation

### Step 1 — Get the code

```bash
git clone <repository-url>
cd UI-Automation-Framework
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Install Playwright browsers

```bash
npx playwright install chromium
```

> Only Chromium is needed for Salesforce tests. Install all browsers only if you plan to run cross-browser tests for non-SF web applications.

### Step 4 — Configure your environment (see Section 3)

---

## 3. Configuration

The framework reads all settings from environment files. There is one file per environment.

| File | Purpose |
|---|---|
| `.env.dev` | Development / sandbox org |
| `.env.qa` | QA org |
| `.env.uat` | UAT org |

### What to fill in

Open `.env.dev` (or the relevant file for your environment) and set these values:

```ini
# ── Salesforce org URL ────────────────────────────────────────────────────────
BASE_URL=https://your-org-name.my.salesforce.com

# ── Salesforce REST API (needed only for UI vs API comparison tests) ──────────
# Create a Connected App in Salesforce Setup to get these values.
SF_CLIENT_ID=your_connected_app_consumer_key
SF_CLIENT_SECRET=your_connected_app_consumer_secret
SF_USERNAME=your_test_user@example.com
SF_PASSWORD=your_test_user_password
SF_SECURITY_TOKEN=your_security_token
SF_AUTH_URL=https://login.salesforce.com/services/oauth2/token
SF_API_VERSION=v62.0

# ── Salesforce Data Cloud (needed only for UI vs Data Cloud tests) ────────────
SF_DC_API_VERSION=v1
```

> **Do not commit `.env.*` files** to version control. They contain credentials. They are already listed in `.gitignore`.

### Salesforce test user credentials

Login credentials for test cases go in `src/testdata/yaml/credentials.yaml` (not in `.env.*`). See [Section 6](#6-test-data-yaml-files) for details.

### Salesforce Connected App setup (for API tests)

To use the REST API comparison tests you need a Connected App in your Salesforce org:

1. Go to **Setup → App Manager → New Connected App**
2. Enable **OAuth Settings**
3. Add scopes: `api`, `refresh_token`
4. Save and copy the **Consumer Key** → `SF_CLIENT_ID`
5. Copy the **Consumer Secret** → `SF_CLIENT_SECRET`
6. Get your **Security Token** from **Setup → My Personal Information → Reset My Security Token**

---

## 4. Project Structure

```
UI-Automation-Framework/
│
├── .env.dev                        ← Environment config for dev org
├── .env.qa                         ← Environment config for QA org
├── .env.uat                        ← Environment config for UAT org
│
├── playwright.config.ts            ← Playwright settings, projects, timeouts, reporters
├── package.json                    ← npm scripts and dependencies
│
├── src/                            ← All reusable framework code (explained in Section 5)
│   ├── api/                        ← Salesforce REST API and Data Cloud API clients
│   ├── components/salesforce/      ← Lightning Web Component helpers
│   ├── config/                     ← Environment config loader
│   ├── fixtures/                   ← Playwright fixtures and auth setup
│   ├── helpers/                    ← Comparison utilities
│   ├── interfaces/                 ← TypeScript type definitions
│   ├── locators/                   ← All CSS selectors in one place
│   ├── pages/                      ← Page Object Model classes
│   ├── testdata/yaml/              ← Test data files (YAML)
│   └── utils/                      ← Logger, RetryHandler, YamlReader
│
├── tests/                          ← Test spec files (what testers write)
│   ├── example.spec.ts             ← Non-SF example test
│   └── salesforce/
│       ├── login.spec.ts           ← Salesforce login tests
│       └── account.spec.ts         ← Account UI vs API comparison tests
│
├── logs/                           ← Auto-generated log files (created on first run)
│   ├── combined.log                ← All log levels
│   └── error.log                   ← Errors only
│
├── screenshots/                    ← Auto-captured on test failure
└── .auth/                          ← Auto-generated Salesforce session state (created on first run)
    └── sf-admin.json               ← Saved browser cookies/session (do not commit this file)
```

---

## 5. Source Folder Reference (`src/`)

---

### `src/config/`

Handles loading and validating environment variables from `.env.*` files.

#### `environment.interface.ts`

Defines the TypeScript types for all configuration objects. You will not edit this file directly unless adding a new config section.

```
EnvironmentConfig
  ├── env           → 'dev' | 'qa' | 'uat'
  ├── baseUrl       → from BASE_URL in .env.*
  ├── apiUrl        → from API_URL in .env.*
  ├── db            → database connection details
  ├── salesforce    → SF org + API credentials
  └── dataCloud     → Data Cloud API settings
```

#### `ConfigManager.ts`

A singleton that reads `.env.{environment}` on startup and exposes typed getters. Throws a clear error if a required variable is missing.

```typescript
// How to use it in your code
import { configManager } from '../config/ConfigManager';

const url = configManager.getBaseUrl();          // BASE_URL value
const sf  = configManager.getSalesforceConfig(); // all SF API settings
```

> Testers do not call ConfigManager directly. Page objects and API clients use it internally.

---

### `src/interfaces/`

TypeScript type definitions that describe the shape of data used across the framework. These are contracts — they describe what a class must do or what a data object looks like.

| File | What it defines |
|---|---|
| `ILogger.ts` | Logger interface: `info`, `warn`, `error`, `debug` methods |
| `IRetryHandler.ts` | Retry interface: `execute(action, description, options)` |
| `IBasePage.ts` | All 10 BasePage methods with their option types |
| `IYamlReader.ts` | YamlReader interface: `getUser`, `getCredential`, `getEnvironment`, etc. |
| `ISalesforceApiClient.ts` | SF REST API interface: `query`, `getRecord`, `getRecordsByField` |
| `IDataCloudApiClient.ts` | Data Cloud interface: `query`, `queryRaw` |
| `IComparisonHelper.ts` | Comparison interface: `compare`, `compareDate`, `logSummary`, etc. |
| `salesforce.types.ts` | TypeScript types for SF records: `SfAccount`, `SfContact`, `SfOpportunity`, `SfLead`, `SoqlResult`, `DataCloudQueryResult` |
| `yaml.types.ts` | TypeScript types for YAML data: `User`, `Credential`, `EnvironmentData` |

> Testers use `salesforce.types.ts` and `yaml.types.ts` when accessing typed test data in their test files.

---

### `src/utils/`

Shared utility classes used throughout the framework.

#### `Logger.ts`

Creates a Winston logger instance. Each class gets its own logger with a context label that appears in every log line.

```
[2026-06-17 17:51:49] [info]: [SF:LoginPage] Navigating to Salesforce login
                               ^^^^^^^^^^^^^^ context label
```

Log files are written to:
- `logs/combined.log` — all log levels
- `logs/error.log` — errors only

Log level is controlled by the `LOG_LEVEL` environment variable (defaults to `info`). Set to `debug` for verbose output.

```bash
# Run with debug logs (PowerShell)
$env:LOG_LEVEL="debug"; $env:ENV="dev"; npx playwright test
```

#### `RetryHandler.ts`

Retries a failing async action up to N times with exponential backoff (`delay × attempt`). Used internally by BasePage for unstable UI interactions.

```typescript
// Default: 3 retries, 500ms base delay (500 → 1000 → 1500ms)
await retryHandler.execute(
  () => page.click(selector),
  'click Save button',
  { retries: 3, delayMs: 500 }
);
```

#### `YamlReader.ts`

Reads YAML test data files and returns typed objects. Caches each file in memory after the first read so subsequent reads are instant.

```typescript
import { yamlReader } from '../utils/YamlReader';

// Get credentials for the current test (keyed by test title)
const cred = yamlReader.getCredential(testInfo.title);
// → { username: '...', password: '...', role: 'admin' }

// Get user details for the current test
const user = yamlReader.getUser(testInfo.title);
// → { firstName: 'Sarah', lastName: 'Connor', role: 'admin' }

// Read any YAML file with a custom key
const data = yamlReader.get<MyType>(testInfo.title, 'src/testdata/yaml/sf-accounts.yaml');
```

> The key rule: **the YAML key must exactly match `testInfo.title`** (the full test name string). This makes each test independent — changing one test's data cannot accidentally affect another.

---

### `src/locators/`

#### `SalesforceLocators.ts`

One central file for all CSS selectors. Grouping selectors here — rather than scattering them in page objects — means a UI change only requires editing one file.

```typescript
SalesforceLocators.login.usernameInput      // '#username'
SalesforceLocators.home.appLauncherButton   // 'button[title="App Launcher"]'
SalesforceLocators.record.outputField('Name')  // 'lightning-output-field[field-name="Name"] ...'
SalesforceLocators.account.phoneField       // 'lightning-output-field[field-name="Phone"]'
```

Groups available: `login`, `home`, `record`, `list`, `account`, `contact`, `opportunity`.

---

### `src/pages/`

Page Object Model classes. Each class represents one screen or page in Salesforce and exposes readable methods for actions and assertions.

#### `BasePage.ts`

The abstract base class that all page objects extend. Every page object inherits these methods automatically.

| Method | What it does |
|---|---|
| `click(selector)` | Clicks an element with retry |
| `fill(selector, text)` | Clears and types in a text field |
| `type(selector, text)` | Types character-by-character (for autocomplete fields) |
| `waitForVisible(selector)` | Waits until an element appears on screen |
| `waitForHidden(selector)` | Waits until an element disappears |
| `verifyText(selector, text)` | Asserts an element contains a specific text |
| `verifyVisible(selector)` | Asserts an element is visible |
| `captureScreenshot(name)` | Saves a PNG to the `screenshots/` folder |
| `selectDropdown(selector, value)` | Selects from a native `<select>` element |
| `uploadFile(selector, filePath)` | Uploads a file via a file input |

All methods accept an optional `options` object: `{ timeout: number, retries: number }`.

#### `src/pages/salesforce/LoginPage.ts`

Handles the Salesforce login page at `https://login.salesforce.com`.

| Method | What it does |
|---|---|
| `navigate()` | Opens the Salesforce login page |
| `login(username, password)` | Fills credentials and clicks Login |
| `verifyLoginSuccess()` | Confirms Lightning home page loaded |
| `verifyLoggedInUser(firstName)` | Checks the logged-in user's name in the nav |
| `verifyErrorMessage(text)` | Checks for a specific login error message |

#### `src/pages/salesforce/HomePage.ts`

Salesforce Lightning home page after login.

| Method | What it does |
|---|---|
| `goto()` | Navigates directly to the SF home URL |
| `waitForLoad()` | Waits for the App Launcher to be visible |
| `openAppLauncher()` | Clicks the waffle icon and waits for search |
| `navigateToApp(appName)` | Opens a specific Salesforce app by name |
| `navigateToObject(apiName)` | Goes to the list view for an object (e.g. `'Account'`) |
| `navigateToRecord(recordId)` | Goes directly to a record by its 18-char Salesforce ID |
| `clickNavItem(label)` | Clicks a tab in the context bar navigation |
| `verifyLoggedInAs(firstName)` | Asserts user's first name in the header |

#### `src/pages/salesforce/RecordPage.ts`

Generic Lightning record detail page. `AccountPage`, `ContactPage`, and `OpportunityPage` all extend this.

| Method | What it does |
|---|---|
| `waitForLoad()` | Waits for the record page title to appear |
| `getPageTitle()` | Returns the record name shown in the header |
| `getFieldValue(apiName)` | Returns the visible text value of one field |
| `getFieldValues(apiNames[])` | Returns a map of multiple fields in one call |
| `getAllFieldValues()` | Returns every visible output field on the page |
| `clickEdit()` | Clicks the Edit button to enter edit mode |
| `setFieldValue(apiName, value)` | Sets an input field value in edit mode |
| `clickSave()` | Saves the record and waits for the page to reload |
| `clickCancel()` | Cancels edit mode |
| `clickRelatedTab(label)` | Switches to a Related tab (e.g. `'Contacts'`) |

#### `src/pages/salesforce/AccountPage.ts`

Extends `RecordPage` with Account-specific methods.

| Method | What it does |
|---|---|
| `navigateById(accountId)` | Opens an Account record by Salesforce ID |
| `getName()` | Returns the Account Name field value |
| `getPhone()` | Returns Phone |
| `getWebsite()` | Returns Website |
| `getIndustry()` | Returns Industry |
| `getType()` | Returns Account Type |
| `getBillingAddress()` | Returns the full billing address |
| `getAccountSnapshot()` | Returns all standard Account fields at once |

#### `src/pages/salesforce/ContactPage.ts`

Extends `RecordPage` with Contact-specific methods.

| Method | What it does |
|---|---|
| `navigateById(contactId)` | Opens a Contact record by Salesforce ID |
| `getFirstName()` | Returns First Name |
| `getLastName()` | Returns Last Name |
| `getEmail()` | Returns Email |
| `getPhone()` | Returns Phone |
| `getTitle()` | Returns Title |
| `getAccountName()` | Returns the linked Account name |
| `getFullName()` | Returns `"FirstName LastName"` combined |
| `getContactSnapshot()` | Returns all standard Contact fields at once |

#### `src/pages/salesforce/OpportunityPage.ts`

Extends `RecordPage` with Opportunity-specific methods.

| Method | What it does |
|---|---|
| `navigateById(opportunityId)` | Opens an Opportunity record by Salesforce ID |
| `getName()` | Returns Opportunity Name |
| `getStage()` | Returns Stage Name |
| `getCloseDate()` | Returns Close Date |
| `getAmount()` | Returns Amount |
| `getProbability()` | Returns Probability |
| `getAccountName()` | Returns the linked Account name |
| `getOpportunitySnapshot()` | Returns all standard Opportunity fields at once |

---

### `src/components/salesforce/`

Helpers for Salesforce Lightning Web Components (LWC). These are components that appear inside standard pages — they are NOT full pages themselves. You use them from inside page object methods.

#### `LightningRecordForm.ts`

Reads field values from a Lightning record detail page. Works with the `lightning-output-field` elements that Salesforce renders in view mode.

```typescript
const form = new LightningRecordForm(page);

// Read one field by its Salesforce API name
const name = await form.getFieldValue('Name');

// Read multiple fields at once
const values = await form.getFieldValues(['Name', 'Phone', 'Industry']);
// → { Name: 'Acme Corp', Phone: '555-1234', Industry: 'Technology' }

// Read every field on the page
const all = await form.getAllFieldValues();
```

#### `LightningCombobox.ts`

Interacts with Salesforce dropdown fields (`lightning-combobox`). These are NOT native HTML `<select>` elements — they require special handling.

```typescript
const combobox = new LightningCombobox(page, page.locator('lightning-combobox[data-id="Industry"]'));

await combobox.select('Technology');   // opens and picks an option
const current = await combobox.getValue(); // reads selected value
const options = await combobox.getOptions(); // lists all available options
```

#### `LightningLookup.ts`

Interacts with relationship lookup fields (`lightning-lookup`) — fields that let you search for and link another record (e.g. linking a Contact to an Account).

```typescript
const lookup = new LightningLookup(page, page.locator('lightning-lookup[data-field-id="AccountId"]'));

await lookup.search('Acme', 'Acme Corp');  // types search term, selects result
const linked = await lookup.getValue();    // returns the currently linked record name
await lookup.clear();                      // removes the linked record
```

#### `LightningDataTable.ts`

Reads data from Salesforce data tables (`lightning-datatable`) — the grid-style tables used in related lists and list views.

```typescript
const table = new LightningDataTable(page.locator('lightning-datatable'));

const rows = await table.getRowCount();    // total rows
const headers = await table.getColumnHeaders(); // column names
const cell = await table.getCellValue(0, 'Name'); // row 0, column 'Name'
const row = await table.getRowData(0);     // all cells in row 0 as { label: value }
const allRows = await table.getAllRows();   // all rows as array of { label: value }

// Find a specific row
const match = await table.findRow('Status', 'Active');
```

---

### `src/api/`

API clients that call Salesforce services directly (bypassing the UI). Used in comparison tests to get the expected values.

#### `src/api/salesforce/SalesforceAuthManager.ts`

Handles OAuth 2.0 authentication with Salesforce. Uses the **Username + Password** flow. Caches the access token for 1 hour and automatically refreshes it when expired.

> Testers do not use this class directly. `SalesforceApiClient` uses it internally.

#### `src/api/salesforce/SalesforceApiClient.ts`

The main Salesforce REST API client. Call it in tests to fetch the source-of-truth data to compare against the UI.

```typescript
import { getSalesforceApiClient } from '../api/salesforce/SalesforceApiClient';
import { SfAccount } from '../interfaces/salesforce.types';

const sfApi = getSalesforceApiClient();

// Run a SOQL query
const accounts = await sfApi.query<SfAccount>(
  "SELECT Id, Name, Phone FROM Account WHERE Name = 'Acme Corp'"
);

// Get a record by its Salesforce ID
const account = await sfApi.getRecord<SfAccount>('Account', '001XXXXXXXXXXXXXXXXX', ['Name', 'Phone']);

// Get records where a field equals a value
const results = await sfApi.getRecordsByField<SfAccount>(
  'Account', 'Name', 'Acme Corp', ['Id', 'Name', 'Phone', 'Industry']
);
```

Requires `SF_CLIENT_ID`, `SF_CLIENT_SECRET`, `SF_USERNAME`, `SF_PASSWORD`, `SF_SECURITY_TOKEN` to be set in the `.env.*` file.

#### `src/api/datacloud/DataCloudApiClient.ts`

Queries Salesforce Data Cloud using SQL. Used in UI vs Data Cloud comparison tests.

```typescript
import { getDataCloudApiClient } from '../api/datacloud/DataCloudApiClient';

const dcApi = getDataCloudApiClient();

// Run a SQL query against Data Cloud
const rows = await dcApi.query<{ Name: string; Industry__c: string }>(
  "SELECT Name, Industry__c FROM Account__dlm WHERE Id__c = '001XXXXXXXXXXXXXXXXX' LIMIT 1"
);
```

Requires the same credentials as `SalesforceApiClient`. Data Cloud uses the same OAuth token.

---

### `src/helpers/`

#### `ComparisonHelper.ts`

Compares UI field values against an expected source (Salesforce Object or Data Cloud). Uses Playwright's **soft assertions** — all mismatches are collected and reported together at the end of the test, rather than failing on the first mismatch.

```typescript
import { ComparisonHelper } from '../helpers/ComparisonHelper';

const comparator = new ComparisonHelper('SF Object'); // label shown in output

comparator
  .compare('Name',      uiValue.Name,     apiRecord.Name)      // exact match
  .compareIgnoreCase('Industry', uiValue.Industry, apiRecord.Industry) // case-insensitive
  .compareNumber('Employees', uiValue.Employees, apiRecord.NumberOfEmployees) // numeric
  .compareDate('CloseDate', uiValue.CloseDate, apiRecord.CloseDate) // date normalised to YYYY-MM-DD
  .logSummary(); // prints pass/fail table to the log

// Output example:
// [ComparisonHelper] 3 passed, 1 failed
//   ✓ Name:       UI="Acme Corp"      | SF Object="Acme Corp"
//   ✓ Industry:   UI="Technology"     | SF Object="TECHNOLOGY"
//   ✗ Employees:  UI="500"            | SF Object="501"
//   ✓ CloseDate:  UI="06/17/2026"     | SF Object="2026-06-17"
```

All failures are visible in the Playwright HTML and Ortoni reports.

---

### `src/fixtures/`

Playwright fixtures provide pre-built, ready-to-use objects to every test automatically. Tests declare what they need and Playwright injects it.

#### `src/fixtures/salesforce/sfAuth.setup.ts`

A special Playwright **setup project** that runs once before any SF test. It:
1. Opens a browser and logs in to Salesforce
2. Waits for the Lightning home page to load
3. Saves all browser cookies and session data to `.auth/sf-admin.json`

All subsequent tests load this saved session — they start already logged in without repeating the login steps.

**Requirements for the setup to work:**
- `SF_USERNAME` and `SF_PASSWORD` must be set in `.env.*`
- The machine running tests must be in Salesforce **Trusted IP Ranges** (Setup → Security → Network Access), OR MFA must be disabled for the test user

If MFA is triggered, the setup will print a clear error message with instructions.

#### `src/fixtures/sfFixtures.ts`

Exports an extended `test` function that provides all SF page objects and API clients as fixture parameters.

```typescript
// In your test file — import from sfFixtures instead of @playwright/test
import { test, expect } from '../../src/fixtures/sfFixtures';

test('verify account', async ({ accountPage, sfApi, comparator }) => {
  // accountPage, sfApi, comparator are injected automatically
});
```

Available fixtures:

| Fixture | Type | What you get |
|---|---|---|
| `loginPage` | `LoginPage` | The SF login page object |
| `homePage` | `HomePage` | SF Lightning home (auto-navigated on injection) |
| `recordPage` | `RecordPage` | Generic record page |
| `accountPage` | `AccountPage` | Account record page |
| `contactPage` | `ContactPage` | Contact record page |
| `opportunityPage` | `OpportunityPage` | Opportunity record page |
| `sfApi` | `SalesforceApiClient` | SF REST API client |
| `dcApi` | `DataCloudApiClient` | Data Cloud API client |
| `comparator` | `ComparisonHelper` | Field comparison with soft assertions |

> `loginPage` is also available in fixtures but `login.spec.ts` uses a direct `page` import because it specifically tests the login flow. All other SF tests should use `sfFixtures`.

---

## 6. Test Data (YAML Files)

All test data lives in `src/testdata/yaml/`. YAML is used because it is human-readable, easy to maintain, and supports structured data.

### Key rule: YAML keys must match the test title exactly

The test title in your spec file is the lookup key:

```typescript
test('TC_SF_Login_001 - Login with valid admin credentials', async ({}, testInfo) => {
  const cred = yamlReader.getCredential(testInfo.title);
  //                                     ^^^^^^^^^^^^^^
  //                  testInfo.title = 'TC_SF_Login_001 - Login with valid admin credentials'
});
```

The YAML file must have that exact string as a key:

```yaml
# credentials.yaml
TC_SF_Login_001 - Login with valid admin credentials:
  username: test@example.com
  password: MyPassword123
  role: admin
```

### File-by-file reference

#### `users.yaml`

Personal details about the test user (first name, last name, role). Used to verify the logged-in user's name appears correctly in the UI.

```yaml
TC_SF_Login_001 - Login with valid admin credentials:
  firstName: Sarah
  lastName: Connor
  role: admin
  email: sarah.connor@example.com
```

#### `credentials.yaml`

Login credentials for each test case. Contains sensitive data — never commit real passwords.

```yaml
TC_SF_Login_001 - Login with valid admin credentials:
  username: sarah.connor@example.com
  password: MySecurePassword
  role: admin
```

#### `environments.yaml`

Environment-specific test settings (timeouts, feature flags). Does NOT contain URLs — those come from `.env.*` files.

```yaml
dev:
  timeout: 30000
  features:
    darkMode: true
    betaFeatures: true
qa:
  timeout: 30000
  features:
    darkMode: true
    betaFeatures: false
```

#### `sf-accounts.yaml`

Test data for Account comparison tests. Each entry specifies the Salesforce record ID and which fields to compare.

```yaml
TC_SF_Account_001 - Verify Account UI fields match Salesforce Object:
  accountId: 001XXXXXXXXXXXXXXXXX     # replace with a real Account Id
  compareFields:
    - Name
    - Phone
    - Industry
    - Website
    - Type
```

> Find a record's ID in the Salesforce URL when viewing the record:
> `https://your-org.lightning.force.com/lightning/r/Account/001XXXXXXXXXXXXXXXXX/view`

---

## 7. Running Tests

### Environment selection

The `ENV` variable selects which `.env.*` file and which Salesforce org to use.

### Available scripts

| Command | What it runs |
|---|---|
| `npm run test:dev` | All tests against the dev org (headless) |
| `npm run test:qa` | All tests against the QA org |
| `npm run test:uat` | All tests against the UAT org |
| `npm run test:dev:headed` | Dev org with the browser window visible |
| `npm run test:qa:headed` | QA org with browser visible |
| `npm run test:uat:headed` | UAT org with browser visible |

### Run a specific test file

```bash
# PowerShell
$env:ENV="dev"; npx playwright test tests/salesforce/login.spec.ts
```

### Run a specific test by name

```bash
$env:ENV="dev"; npx playwright test --grep "TC_SF_Login_001"
```

### Run only Salesforce tests

```bash
$env:ENV="dev"; npx playwright test --project=sf-chromium
```

### Run with debug logs visible

```bash
$env:LOG_LEVEL="debug"; $env:ENV="dev"; npx playwright test --headed
```

### How the test projects work

The framework has four Playwright projects defined in `playwright.config.ts`:

| Project | What it runs | Uses saved login? |
|---|---|---|
| `sf-setup` | `sfAuth.setup.ts` — logs in once and saves session | No |
| `sf-chromium` | All tests in `tests/salesforce/` | Yes — loads `.auth/sf-admin.json` |
| `chromium` | All tests EXCEPT `tests/salesforce/` | No |
| `firefox` / `webkit` | Non-SF tests on other browsers | No |

When you run `npm run test:dev`, Playwright automatically:
1. Runs `sf-setup` first (logs in, saves cookies)
2. Then runs `sf-chromium` (all SF tests start already logged in)
3. Then runs `chromium`, `firefox`, `webkit` (non-SF tests)

The login test (`login.spec.ts`) is an exception — it overrides the saved session and always performs a fresh login, because it is specifically testing the login flow itself.

---

## 8. Reports

Two reports are generated automatically after every test run.

### Playwright HTML Report

Built into Playwright. Shows pass/fail status, error messages, screenshots, and video recordings.

```bash
npm run report
# Opens in your default browser at http://localhost:9323
```

### Ortoni Report

A richer HTML report with environment metadata, historical comparison, and better visual layout.

Each run creates a timestamped folder:
```
ortoni-report-dev-20260617-175146/
ortoni-report-qa-20260618-090030/
```

To view the latest report, open the HTML file in a browser:
```
ortoni-report-dev-YYYYMMDD-HHmmss/index.html
```

### What's in the reports

- Pass / fail status per test
- Environment name (dev / qa / uat) and timestamp
- Error messages and stack traces
- Screenshots (captured automatically on failure)
- Video recordings (retained on failure)
- Playwright traces (on first retry — for debugging step-by-step)

### Logs

Text logs are written to the `logs/` folder:
- `logs/combined.log` — everything
- `logs/error.log` — errors only

Each log line includes a timestamp and the class context:
```
2026-06-17 17:51:49 [info]: [SF:AccountPage] Navigate to Account → 001XXXXXXXXXXXXXXXXX
2026-06-17 17:51:52 [info]: [ComparisonHelper] 3 passed, 1 failed
```

---

## 9. Writing a New Test

### Step 1 — Choose the test type

| You want to... | Use this pattern |
|---|---|
| Verify UI shows correct values | `sfFixtures` + page object `getFieldValue()` + `verifyText()` |
| Compare UI against Salesforce Object | `sfFixtures` + `sfApi.query()` + `comparator.compare()` |
| Compare UI against Data Cloud | `sfFixtures` + `dcApi.query()` + `comparator.compare()` |

### Step 2 — Add test data to YAML

Add an entry to the relevant YAML file in `src/testdata/yaml/`. The key must match your planned test title exactly.

```yaml
# sf-accounts.yaml
TC_SF_Account_005 - Verify Account name and phone match API:
  accountId: 001XXXXXXXXXXXXXXXXX
  compareFields:
    - Name
    - Phone
```

### Step 3 — Write the test

Create or add to a spec file in `tests/salesforce/`.

```typescript
// tests/salesforce/account.spec.ts
import { test, expect }  from '../../src/fixtures/sfFixtures';
import { yamlReader }    from '../../src/utils/YamlReader';
import { SfAccount }     from '../../src/interfaces/salesforce.types';
import * as path         from 'path';

const SF_ACCOUNTS_YAML = path.resolve('src/testdata/yaml/sf-accounts.yaml');

interface AccountTestData {
  accountId:     string;
  compareFields: string[];
}

test.describe('Account Verification', () => {

  test('TC_SF_Account_005 - Verify Account name and phone match API',
    async ({ accountPage, sfApi, comparator }, testInfo) => {

      const { accountId, compareFields } = yamlReader.get<AccountTestData>(
        testInfo.title, SF_ACCOUNTS_YAML
      );

      // 1. Read UI values
      await accountPage.navigateById(accountId);
      const ui = await accountPage.getFieldValues(compareFields);

      // 2. Read API values
      const apiRecord = await sfApi.getRecord<SfAccount>('Account', accountId, compareFields);

      // 3. Compare
      comparator
        .compare('Name',  ui['Name'],  apiRecord.Name  ?? '')
        .compare('Phone', ui['Phone'], apiRecord.Phone ?? '')
        .logSummary();
    }
  );

});
```

### Step 4 — Run and verify

```bash
$env:ENV="dev"; npx playwright test --grep "TC_SF_Account_005" --headed
```

---

## 10. Common Issues

### "SF_USERNAME and SF_PASSWORD must be set"

The auth setup (`sfAuth.setup.ts`) ran but found empty credentials.

**Fix:** Open `.env.dev` and fill in `SF_USERNAME` and `SF_PASSWORD`.

---

### "Salesforce requires identity verification (MFA)"

The test user triggered MFA during the auth setup.

**Fix (choose one):**
- Add the machine's IP address to **Salesforce Setup → Security → Network Access → Trusted IP Ranges**
- Or disable MFA for the test user in **Salesforce Setup → Users → [test user] → uncheck MFA**

---

### "element not found" on a Lightning field

The field's API name in your test does not match the actual Salesforce field API name.

**Fix:** Check the field's API name in **Salesforce Setup → Object Manager → [Object] → Fields & Relationships**.

---

### YAML key mismatch error

```
YamlReader: key "TC_SF_Account_001 - Verify..." not found in sf-accounts.yaml
```

The test title and the YAML key do not match exactly (spacing, punctuation, or capitalisation difference).

**Fix:** Copy the exact test title string from your spec file and use it as the YAML key.

---

### Test passes locally but fails in CI

Likely cause: MFA triggers in CI because the CI server IP is not in Trusted IP Ranges.

**Fix:** Add the CI server's outbound IP to Salesforce Trusted IP Ranges. For GitHub Actions, the IPs change per run — consider using a dedicated test user with MFA entirely disabled.

---

### Log shows "SF API 401 Unauthorized"

The API access token expired or the Connected App credentials are wrong.

**Fix:** Verify `SF_CLIENT_ID`, `SF_CLIENT_SECRET`, and `SF_SECURITY_TOKEN` in `.env.*`. Regenerate the security token from **Salesforce Setup → My Personal Information → Reset My Security Token**.
