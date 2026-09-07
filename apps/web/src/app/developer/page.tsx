'use client';

import React, { useState } from 'react';
import { Code2, Key, Webhook, Play, CheckCircle2, Copy, Check } from 'lucide-react';

export default function DeveloperPortalPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleTestWebhook = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/test/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate_webhook' }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ error: 'Simulation failed' });
    } finally {
      setLoading(false);
    }
  };

  const sampleIntegrationCode = `import CentralPaySDK from '@centralpay/sdk';

const centralPay = new CentralPaySDK({
  apiKey: process.env.CENTRALPAY_SECRET_KEY, // cp_live_sec_xxx
});

// Create payment request
const payment = await centralPay.payments.create({
  app_id: 'app_earnspace',
  customer_id: 'USER_123',
  order_id: 'ORDER_1001',
  amount: 500,
  currency: 'BDT',
  description: 'Wallet Deposit',
});

console.log('Checkout URL:', payment.paymentUrl);
// Redirect user to payment.paymentUrl`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Developer Portal & Webhook Tester</h1>
        <p className="text-xs text-muted">Integration docs, signature verification guide, and interactive webhook tester.</p>
      </div>

      {/* Integration Code Guide */}
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-base text-foreground">Node.js / Next.js SDK Integration</h2>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sampleIntegrationCode);
              setCopiedCode(true);
              setTimeout(() => setCopiedCode(false), 2000);
            }}
            className="px-3 py-1.5 rounded-lg bg-card-border hover:bg-primary/20 text-muted hover:text-primary transition-colors text-xs flex items-center gap-1 font-medium"
          >
            {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedCode ? 'Copied Snippet' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-[#090C12] border border-card-border font-mono text-xs text-accent overflow-x-auto">
          <code>{sampleIntegrationCode}</code>
        </pre>
      </div>

      {/* Webhook Signature Tester (Requirement 46) */}
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-accent" />
            <h2 className="font-bold text-base text-foreground">Webhook Simulator & Signature Tester</h2>
          </div>
          <button
            onClick={handleTestWebhook}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-accent text-background font-bold text-xs hover:bg-accent-hover transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,217,255,0.3)] disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            <span>{loading ? 'Testing...' : 'Run Webhook Delivery Test'}</span>
          </button>
        </div>

        {testResult && (
          <div className="space-y-3 pt-3 border-t border-card-border">
            <div className="flex items-center gap-2 text-xs text-primary font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Simulated Webhook Generated Successfully</span>
            </div>
            <pre className="p-4 rounded-xl bg-[#090C12] border border-card-border font-mono text-xs text-foreground overflow-x-auto">
              <code>{JSON.stringify(testResult, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
