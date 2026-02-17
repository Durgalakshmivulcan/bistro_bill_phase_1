// Integration types for third-party integrations (US-240)

export type IntegrationType = 'accounting' | 'delivery' | 'marketing' | 'payment' | 'inventory' | 'hardware' | 'attendance' | 'voice_assistant';

export type IntegrationProvider =
  | 'tally'
  | 'quickbooks'
  | 'zoho_books'
  | 'dunzo'
  | 'porter'
  | 'whatsapp_business'
  | 'sms_gateway'
  | 'supplier_portal'
  | 'pos_hardware'
  | 'biometric'
  | 'voice_ordering';

export type IntegrationStatus = 'active' | 'inactive' | 'error';

export type Integration = {
  id: string;
  businessOwnerId: string;
  provider: IntegrationProvider;
  type: IntegrationType;
  config: Record<string, unknown>;
  status: IntegrationStatus;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationLog = {
  id: string;
  integrationId: string;
  action: string;
  status: string;
  requestPayload: Record<string, unknown> | null;
  responsePayload: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
};
