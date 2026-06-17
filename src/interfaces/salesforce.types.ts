// ─── Base SF record ──────────────────────────────────────────────────────────

export interface SfRecord {
  Id: string;
  Name?: string;
  CreatedDate?: string;
  LastModifiedDate?: string;
  attributes?: { type: string; url: string };
}

// ─── Standard objects ─────────────────────────────────────────────────────────

export interface SfAccount extends SfRecord {
  Name: string;
  Phone?: string;
  Fax?: string;
  Website?: string;
  Industry?: string;
  Type?: string;
  AnnualRevenue?: number;
  NumberOfEmployees?: number;
  BillingStreet?: string;
  BillingCity?: string;
  BillingState?: string;
  BillingPostalCode?: string;
  BillingCountry?: string;
  OwnerId?: string;
  Description?: string;
}

export interface SfContact extends SfRecord {
  FirstName?: string;
  LastName: string;
  Email?: string;
  Phone?: string;
  MobilePhone?: string;
  Title?: string;
  Department?: string;
  AccountId?: string;
  OwnerId?: string;
  MailingStreet?: string;
  MailingCity?: string;
  MailingState?: string;
  MailingPostalCode?: string;
  MailingCountry?: string;
}

export interface SfOpportunity extends SfRecord {
  Name: string;
  AccountId?: string;
  StageName: string;
  CloseDate: string;
  Amount?: number;
  Probability?: number;
  Type?: string;
  LeadSource?: string;
  Description?: string;
  OwnerId?: string;
  IsClosed?: boolean;
  IsWon?: boolean;
}

export interface SfLead extends SfRecord {
  FirstName?: string;
  LastName: string;
  Company: string;
  Email?: string;
  Phone?: string;
  Status: string;
  LeadSource?: string;
  Industry?: string;
  Title?: string;
}

// ─── SOQL query wrapper ───────────────────────────────────────────────────────

export interface SoqlResult<T extends SfRecord> {
  totalSize: number;
  done: boolean;
  nextRecordsUrl?: string;
  records: T[];
}

// ─── UI field snapshot (extracted from Lightning pages) ───────────────────────

export type UiFieldMap = Record<string, string>;

// ─── Data Cloud ──────────────────────────────────────────────────────────────

export interface DataCloudQueryResult<T = Record<string, unknown>> {
  data: T[];
  rowCount: number;
  queryId: string;
  done: boolean;
  metadata: Record<string, { type: string }>;
  startTime: string;
  endTime: string;
  processingTime: number;
}
