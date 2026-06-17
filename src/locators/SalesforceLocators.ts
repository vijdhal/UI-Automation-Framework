export const SalesforceLocators = {

  login: {
    usernameInput:      '#username',
    passwordInput:      '#password',
    loginButton:        '#Login',
    errorMessage:       '#error',
    forgotPasswordLink: '#forgot_password',
  },

  home: {
    appLauncherButton:  'button[title="App Launcher"]',
    appLauncherSearch:  'input[placeholder="Search apps and items..."]',
    userProfileButton:  'button.slds-global-header__item-action[title*="View profile"]',
    userNavLabel:       '.userNavLabel',
    globalNav:          'nav.slds-context-bar',
    navItem:            (label: string) => `a.slds-context-bar__label-action[title="${label}"]`,
  },

  record: {
    // Detail view — Lightning record page
    pageTitle:          'h1.slds-page-header__title',
    editButton:         'button[name="Edit"]',
    saveButton:         'button[name="SaveEdit"]',
    cancelButton:       'button[name="CancelEdit"]',
    deleteButton:       'button[name="Delete"]',
    relatedTabButton:   (label: string) => `a.slds-tabs_default__link[title="${label}"]`,
    outputField:        (apiName: string) => `lightning-output-field[field-name="${apiName}"] .slds-form-element__static`,
    inputField:         (apiName: string) => `lightning-input-field[field-name="${apiName}"] input`,
    fieldLabel:         (apiName: string) => `lightning-output-field[field-name="${apiName}"] label`,
  },

  list: {
    newButton:          'a[title="New"]',
    searchBox:          'input.forceSearchInput',
    tableRows:          'table tbody tr',
    paginationNext:     'button[title="Next Page"]',
    listTitle:          '.slds-page-header__title',
  },

  account: {
    nameField:          'lightning-output-field[field-name="Name"]',
    phoneField:         'lightning-output-field[field-name="Phone"]',
    industryField:      'lightning-output-field[field-name="Industry"]',
    websiteField:       'lightning-output-field[field-name="Website"]',
    typeField:          'lightning-output-field[field-name="Type"]',
    billingCityField:   'lightning-output-field[field-name="BillingCity"]',
  },

  contact: {
    firstNameField:     'lightning-output-field[field-name="FirstName"]',
    lastNameField:      'lightning-output-field[field-name="LastName"]',
    emailField:         'lightning-output-field[field-name="Email"]',
    phoneField:         'lightning-output-field[field-name="Phone"]',
    accountNameField:   'lightning-output-field[field-name="AccountId"]',
    titleField:         'lightning-output-field[field-name="Title"]',
  },

  opportunity: {
    nameField:          'lightning-output-field[field-name="Name"]',
    stageField:         'lightning-output-field[field-name="StageName"]',
    closeDateField:     'lightning-output-field[field-name="CloseDate"]',
    amountField:        'lightning-output-field[field-name="Amount"]',
    accountNameField:   'lightning-output-field[field-name="AccountId"]',
    probabilityField:   'lightning-output-field[field-name="Probability"]',
  },

} as const;
