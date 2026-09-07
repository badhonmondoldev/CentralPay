-- CentralPay MAX RLS Policies
-- Migration 00002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parsed_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 1. Public / Anon Access for Hosted Checkout
CREATE POLICY "Public Read for Hosted Payment Checkout"
ON public.payment_requests
FOR SELECT
USING (true);

-- 2. Service Role & Authenticated Admin Full Access
CREATE POLICY "Admin Full Access on Apps" ON public.apps FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on API Keys" ON public.api_keys FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Devices" ON public.devices FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Device Sessions" ON public.device_sessions FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Payment Sources" ON public.payment_sources FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Payment Requests" ON public.payment_requests FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Payments" ON public.payments FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on SMS Events" ON public.sms_events FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Parsed Transactions" ON public.parsed_transactions FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Transaction Matches" ON public.transaction_matches FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Ledger Entries" ON public.ledger_entries FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Webhook Events" ON public.webhook_events FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Webhook Deliveries" ON public.webhook_deliveries FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Risk Events" ON public.risk_events FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Fraud Alerts" ON public.fraud_alerts FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on Audit Logs" ON public.audit_logs FOR ALL TO authenticated, service_role USING (true);
CREATE POLICY "Admin Full Access on System Settings" ON public.system_settings FOR ALL TO authenticated, service_role USING (true);
