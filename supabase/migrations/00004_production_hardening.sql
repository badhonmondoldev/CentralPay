-- CentralPay MAX Production Hardening Schema Migration
-- Migration 00004_production_hardening.sql

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN', -- SUPER_ADMIN, FINANCE_MANAGER, SUPPORT_AGENT, DEVELOPER, VIEWER
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Admin Sessions Table (Supports rotation, revocation, logout all)
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    session_token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(100),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Admin Login Attempts Table (Brute-force protection & rate limiting)
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address VARCHAR(100) NOT NULL,
    identifier VARCHAR(255) NOT NULL,
    is_successful BOOLEAN NOT NULL DEFAULT FALSE,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Idempotency Records Table
CREATE TABLE IF NOT EXISTS public.idempotency_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key VARCHAR(255) NOT NULL,
    app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
    request_hash VARCHAR(64) NOT NULL,
    response_status INT NOT NULL,
    response_body JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_app_idempotency UNIQUE (app_id, idempotency_key)
);

-- 5. Refunds Table
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, APPROVED, PROCESSING, COMPLETED, FAILED, REJECTED
    approved_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Enhance apps table with allowed redirect domains
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'allowed_redirect_domains') THEN
        ALTER TABLE public.apps ADD COLUMN allowed_redirect_domains TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

-- 7. Enhance payment_sources with limits & routing fields
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_sources' AND column_name = 'daily_limit') THEN
        ALTER TABLE public.payment_sources ADD COLUMN daily_limit NUMERIC(15, 2) NOT NULL DEFAULT 100000.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_sources' AND column_name = 'per_tx_limit') THEN
        ALTER TABLE public.payment_sources ADD COLUMN per_tx_limit NUMERIC(15, 2) NOT NULL DEFAULT 25000.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_sources' AND column_name = 'today_received_amount') THEN
        ALTER TABLE public.payment_sources ADD COLUMN today_received_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_sources' AND column_name = 'last_reset_date') THEN
        ALTER TABLE public.payment_sources ADD COLUMN last_reset_date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- 8. Indexes for High-Velocity Queries
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON public.admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip ON public.admin_login_attempts(ip_address, attempted_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_key ON public.idempotency_records(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);

-- 9. Enable RLS on New Tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin Full Access on Admins" ON public.admins FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Admin Sessions" ON public.admin_sessions FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Login Attempts" ON public.admin_login_attempts FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Idempotency Records" ON public.idempotency_records FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Refunds" ON public.refunds FOR ALL TO authenticated, service_role USING (true);
