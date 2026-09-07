-- CentralPay MAX Initial Supabase Database Schema
-- Migration 00001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Connected Applications
CREATE TABLE IF NOT EXISTS public.apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    website_url TEXT,
    logo_url TEXT,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DISABLED, SUSPENDED
    environment VARCHAR(50) NOT NULL DEFAULT 'LIVE', -- LIVE, TEST
    webhook_url TEXT,
    webhook_secret VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(32) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    environment VARCHAR(50) NOT NULL DEFAULT 'LIVE', -- LIVE, TEST
    type VARCHAR(50) NOT NULL DEFAULT 'secret', -- publishable, secret
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Devices (Android Agents)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_name VARCHAR(255) NOT NULL,
    public_key TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ONLINE', -- ONLINE, OFFLINE, REVOKED, PENDING_PAIRING
    last_heartbeat TIMESTAMPTZ,
    battery_level INT,
    network_status VARCHAR(50),
    app_version VARCHAR(50),
    os_version VARCHAR(50),
    pending_queue_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Device Nonce Tracking for Replay Protection
CREATE TABLE IF NOT EXISTS public.device_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    nonce VARCHAR(255) NOT NULL UNIQUE,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Payment Sources (Accounts: bKash, Nagad, Rocket, Custom)
CREATE TABLE IF NOT EXISTS public.payment_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    provider_label VARCHAR(50) NOT NULL, -- bKash, Nagad, Rocket, Custom
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(50) NOT NULL DEFAULT 'personal',
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    instructions TEXT,
    priority INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Payment Requests
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    customer_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    reference VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    payment_source_id UUID REFERENCES public.payment_sources(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING_PAYMENT',
    expires_at TIMESTAMPTZ NOT NULL,
    redirect_url TEXT,
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_request_id UUID UNIQUE NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    customer_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    reference VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    risk_score INT NOT NULL DEFAULT 0,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
    matched_transaction_id UUID,
    payment_source_id UUID REFERENCES public.payment_sources(id) ON DELETE SET NULL,
    auto_approved BOOLEAN NOT NULL DEFAULT FALSE,
    review_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Raw & Sanitized SMS Events
CREATE TABLE IF NOT EXISTS public.sms_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    sender VARCHAR(100) NOT NULL,
    message_fingerprint VARCHAR(64) UNIQUE NOT NULL, -- Cryptographic SHA-256 for duplicate protection
    raw_body TEXT,
    sanitized_body TEXT,
    received_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Parsed Transactions
CREATE TABLE IF NOT EXISTS public.parsed_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sms_event_id UUID NOT NULL REFERENCES public.sms_events(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    sender_number VARCHAR(50),
    reference_code VARCHAR(100),
    timestamp TIMESTAMPTZ NOT NULL,
    parser_version VARCHAR(50) NOT NULL DEFAULT 'v1',
    confidence_score INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_provider_tx_id UNIQUE (provider, transaction_id) -- Strict duplicate prevention
);

-- 10. Transaction Matches
CREATE TABLE IF NOT EXISTS public.transaction_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    parsed_transaction_id UUID NOT NULL REFERENCES public.parsed_transactions(id) ON DELETE CASCADE,
    score INT NOT NULL,
    amount_matched BOOLEAN NOT NULL,
    tx_id_matched BOOLEAN NOT NULL,
    reference_matched BOOLEAN NOT NULL,
    source_matched BOOLEAN NOT NULL,
    time_window_matched BOOLEAN NOT NULL,
    review_status VARCHAR(50) DEFAULT 'PENDING', -- APPROVED, REJECTED, PENDING
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Immutable Ledger Entries
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    type VARCHAR(20) NOT NULL DEFAULT 'CREDIT', -- CREDIT, REVERSAL, REFUND
    balance_snapshot NUMERIC(15, 2) NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Webhook Outbox Queue
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_event_id UUID NOT NULL REFERENCES public.webhook_events(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED, RETRYING
    attempt_count INT NOT NULL DEFAULT 0,
    response_code INT,
    response_body TEXT,
    signature VARCHAR(255) NOT NULL,
    next_retry_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Risk Events & Fraud Alerts
CREATE TABLE IF NOT EXISTS public.risk_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    rule_name VARCHAR(255) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    score_delta INT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fraud_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correlation_id VARCHAR(255),
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100),
    target_id VARCHAR(255),
    ip_address VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auto_approval_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    safe_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    min_confidence_score INT NOT NULL DEFAULT 80,
    max_auto_approval_amount NUMERIC(15, 2) NOT NULL DEFAULT 50000,
    payment_expiration_minutes INT NOT NULL DEFAULT 30,
    webhook_max_retries INT NOT NULL DEFAULT 5,
    device_heartbeat_interval_seconds INT NOT NULL DEFAULT 60,
    raw_sms_storage_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert Default System Settings
INSERT INTO public.system_settings (
    auto_approval_enabled,
    safe_mode_enabled,
    min_confidence_score,
    max_auto_approval_amount,
    payment_expiration_minutes,
    webhook_max_retries,
    device_heartbeat_interval_seconds,
    raw_sms_storage_enabled
) VALUES (
    TRUE,
    FALSE,
    80,
    50000.00,
    30,
    5,
    60,
    FALSE
) ON CONFLICT DO NOTHING;

-- Indexing for high performance
CREATE INDEX IF NOT EXISTS idx_apps_slug ON public.apps(slug);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_payment_requests_ref ON public.payment_requests(reference);
CREATE INDEX IF NOT EXISTS idx_payment_requests_app ON public.payment_requests(app_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_sms_events_fingerprint ON public.sms_events(message_fingerprint);
CREATE INDEX IF NOT EXISTS idx_parsed_tx_provider_id ON public.parsed_transactions(provider, transaction_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation ON public.audit_logs(correlation_id);
