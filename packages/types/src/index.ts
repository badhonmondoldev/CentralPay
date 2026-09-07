export type AppStatus = 'ACTIVE' | 'DISABLED' | 'SUSPENDED';
export type AppEnvironment = 'LIVE' | 'TEST';
export type ApiKeyEnvironment = 'LIVE' | 'TEST';

export type PaymentStatus =
  | 'CREATED'
  | 'WAITING_PAYMENT'
  | 'SMS_DETECTED'
  | 'MATCHING'
  | 'VERIFICATION_PENDING'
  | 'VERIFIED'
  | 'COMPLETED'
  | 'REVIEW_REQUIRED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'FAILED'
  | 'REVERSED'
  | 'REFUNDED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'REVOKED' | 'PENDING_PAIRING';

export type WebhookEventType =
  | 'payment.created'
  | 'payment.detected'
  | 'payment.verifying'
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.expired'
  | 'payment.review_required'
  | 'payment.refunded';

export type WebhookDeliveryStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';

export interface Application {
  id: string;
  name: string;
  slug: string;
  website_url?: string;
  logo_url?: string;
  description?: string;
  status: AppStatus;
  environment: AppEnvironment;
  webhook_url?: string;
  webhook_secret?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  app_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  environment: ApiKeyEnvironment;
  type: 'publishable' | 'secret';
  is_active: boolean;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
}

export interface PaymentSource {
  id: string;
  name: string;
  provider_label: 'bKash' | 'Nagad' | 'Rocket' | 'Custom';
  account_number: string;
  account_type: 'personal' | 'agent' | 'merchant';
  currency: string;
  instructions?: string;
  priority: number;
  is_active: boolean;
  device_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  device_name: string;
  public_key: string;
  status: DeviceStatus;
  last_heartbeat?: string;
  battery_level?: number;
  network_status?: string;
  app_version?: string;
  os_version?: string;
  pending_queue_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequestCreateInput {
  app_id: string;
  customer_id: string;
  order_id: string;
  amount: number;
  currency?: string;
  description?: string;
  payment_source_id?: string;
  expires_in_minutes?: number;
  redirect_url?: string;
}

export interface PaymentRequest {
  id: string;
  payment_id: string;
  app_id: string;
  customer_id: string;
  order_id: string;
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  payment_source_id?: string;
  status: PaymentStatus;
  expires_at: string;
  redirect_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  payment_request_id: string;
  app_id: string;
  customer_id: string;
  order_id: string;
  amount: number;
  currency: string;
  reference: string;
  status: PaymentStatus;
  risk_score: number;
  risk_level: RiskLevel;
  matched_transaction_id?: string;
  payment_source_id?: string;
  auto_approved: boolean;
  review_reason?: string;
  metadata?: Record<string, unknown>;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SmsEvent {
  id: string;
  device_id: string;
  sender: string;
  message_fingerprint: string;
  raw_body?: string;
  sanitized_body?: string;
  received_at: string;
  synced_at: string;
  is_duplicate: boolean;
  created_at: string;
}

export interface ParsedTransaction {
  id: string;
  sms_event_id: string;
  provider: 'bKash' | 'Nagad' | 'Rocket' | 'Custom';
  transaction_id: string;
  amount: number;
  currency: string;
  sender_number?: string;
  reference_code?: string;
  timestamp: string;
  parser_version: string;
  confidence_score: number;
  created_at: string;
}

export interface TransactionMatch {
  id: string;
  payment_id: string;
  parsed_transaction_id: string;
  score: number;
  amount_matched: boolean;
  tx_id_matched: boolean;
  reference_matched: boolean;
  source_matched: boolean;
  time_window_matched: boolean;
  review_status?: 'APPROVED' | 'REJECTED' | 'PENDING';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface WebhookEventItem {
  id: string;
  app_id: string;
  payment_id: string;
  event_type: WebhookEventType;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_event_id: string;
  app_id: string;
  target_url: string;
  status: WebhookDeliveryStatus;
  attempt_count: number;
  response_code?: number;
  response_body?: string;
  signature: string;
  next_retry_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  payment_id: string;
  app_id: string;
  amount: number;
  currency: string;
  type: 'CREDIT' | 'REVERSAL' | 'REFUND';
  balance_snapshot: number;
  description: string;
  created_at: string;
}

export interface RiskEvent {
  id: string;
  payment_id?: string;
  device_id?: string;
  rule_name: string;
  risk_level: RiskLevel;
  score_delta: number;
  details: string;
  created_at: string;
}

export interface FraudAlert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  is_resolved: boolean;
  resolved_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SystemSettings {
  id: string;
  auto_approval_enabled: boolean;
  safe_mode_enabled: boolean;
  min_confidence_score: number;
  max_auto_approval_amount: number;
  payment_expiration_minutes: number;
  webhook_max_retries: number;
  device_heartbeat_interval_seconds: number;
  raw_sms_storage_enabled: boolean;
  updated_at: string;
}

export interface AnalyticsMetrics {
  total_volume: number;
  today_volume: number;
  successful_payments: number;
  pending_payments: number;
  failed_payments: number;
  review_required_payments: number;
  connected_apps_count: number;
  active_devices_count: number;
  webhook_health_rate: number;
}
