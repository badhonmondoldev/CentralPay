'use client';

import React, { useState } from 'react';
import {
  Code2,
  Key,
  Webhook,
  Play,
  CheckCircle2,
  Copy,
  Check,
  Bot,
  Terminal,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export default function DeveloperPortalPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedNode, setCopiedNode] = useState(false);
  const [copiedPhp, setCopiedPhp] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [activeTab, setActiveTab] = useState<'node' | 'php' | 'python' | 'curl'>('node');

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

  const aiIntegrationPrompt = `You are an expert developer integrating CentralPay Payment Gateway into an external website (e.g. EarnSpace, Nabrijan, GameStore, E-commerce).

Follow these exact integration instructions:

1. API CONFIGURATION:
   - Base Gateway URL: https://centralpay-xi.vercel.app
   - Header standard: Content-Type: application/json
   - Authentication Header: Authorization: Bearer <YOUR_SECRET_KEY> (e.g., cp_live_sec_xxx)

2. CREATING A PAYMENT SESSION (Step 1):
   - Endpoint: POST https://centralpay-xi.vercel.app/api/v1/payments/create
   - Payload JSON:
     {
       "app_id": "YOUR_APP_ID",
       "customer_id": "CUSTOMER_USER_ID",
       "order_id": "UNIQUE_ORDER_ID",
       "amount": 500,
       "currency": "BDT",
       "description": "Order #1001 Payment",
       "callback_url": "https://yourwebsite.com/payment/callback",
       "metadata": { "product": "VIP Membership" }
     }
   - Response will return:
     {
       "payment_id": "pay_xxx",
       "payment_url": "https://centralpay-xi.vercel.app/pay/pay_xxx",
       "status": "pending"
     }

3. REDIRECTING THE CUSTOMER (Step 2):
   - Redirect customer's browser directly to "payment_url".
   - Customer completes payment via 4-step commercial gateway UI (Sender Mobile -> Send Money -> TrxID submission -> Auto Verification).

4. RECEIVING WEBHOOK NOTIFICATIONS (Step 3):
   - Listen on your backend for POST requests from CentralPay.
   - Headers include: x-centralpay-signature: <HMAC_SHA256_HEX>
   - Payload JSON:
     {
       "event": "payment.completed",
       "payment_id": "pay_xxx",
       "order_id": "UNIQUE_ORDER_ID",
       "trx_id": "9H87G6F5E4",
       "sender_mobile": "01700000000",
       "amount": 500,
       "status": "completed",
       "timestamp": 1700000000
     }
   - Verify HMAC signature using your secret key and mark order as PAID in your database.`;

  const sampleNodeCode = `import fetch from 'node-fetch';

const CENTRALPAY_URL = 'https://centralpay-xi.vercel.app';
const SECRET_KEY = process.env.CENTRALPAY_SECRET_KEY; // cp_live_sec_xxx

// 1. Create Payment Request
export async function createCheckout(orderId, amount, customerId) {
  const response = await fetch(\`\${CENTRALPAY_URL}/api/v1/payments/create\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${SECRET_KEY}\`
    },
    body: JSON.stringify({
      app_id: 'app_earnspace',
      customer_id: customerId,
      order_id: orderId,
      amount: amount,
      currency: 'BDT',
      description: \`Payment for Order #\${orderId}\`,
      callback_url: 'https://yourwebsite.com/payment/callback'
    })
  });

  const data = await response.json();
  if (data.payment_url) {
    // Redirect user to payment_url
    return data.payment_url;
  }
  throw new Error(data.error || 'Failed to create payment');
}`;

  const samplePhpCode = `<?php
// PHP / Laravel CentralPay Integration Helper

function createCentralPayCheckout($orderId, $amount, $customerId) {
    $gatewayUrl = "https://centralpay-xi.vercel.app/api/v1/payments/create";
    $secretKey = getenv('CENTRALPAY_SECRET_KEY'); // cp_live_sec_xxx

    $payload = [
        "app_id" => "app_earnspace",
        "customer_id" => (string)$customerId,
        "order_id" => (string)$orderId,
        "amount" => (float)$amount,
        "currency" => "BDT",
        "description" => "Order #{$orderId} Payment",
        "callback_url" => "https://yourwebsite.com/payment/callback"
    ];

    $ch = curl_init($gatewayUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json",
        "Authorization: Bearer {$secretKey}"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);
    if (isset($result['payment_url'])) {
        header("Location: " . $result['payment_url']);
        exit;
    }

    die("Payment creation failed: " . ($result['error'] ?? 'Unknown error'));
}
?>`;

  const samplePythonCode = `import requests
import os

CENTRALPAY_URL = "https://centralpay-xi.vercel.app"
SECRET_KEY = os.getenv("CENTRALPAY_SECRET_KEY")

def create_checkout_session(order_id: str, amount: float, customer_id: str):
    url = f"{CENTRALPAY_URL}/api/v1/payments/create"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SECRET_KEY}"
    }
    payload = {
        "app_id": "app_earnspace",
        "customer_id": customer_id,
        "order_id": order_id,
        "amount": amount,
        "currency": "BDT",
        "description": f"Payment for Order #{order_id}",
        "callback_url": "https://yourwebsite.com/payment/callback"
    }

    response = requests.post(url, json=payload, headers=headers)
    data = response.json()

    if "payment_url" in data:
        return data["payment_url"]
    
    raise Exception(data.get("error", "Failed to create payment"))`;

  const sampleCurlCode = `curl -X POST https://centralpay-xi.vercel.app/api/v1/payments/create \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer cp_live_sec_your_secret_key" \\
  -d '{
    "app_id": "app_earnspace",
    "customer_id": "USER_9981",
    "order_id": "ORD_2026_0907",
    "amount": 500,
    "currency": "BDT",
    "description": "Wallet Deposit",
    "callback_url": "https://yourwebsite.com/payment/callback"
  }'`;

  const copyToClipboard = (text: string, setFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Code2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Developer Portal & API Docs</h1>
            <p className="text-xs text-muted">Integrate CentralPay MAX commercial gateway into EarnSpace, Nabrijan, GameStore, or any custom website.</p>
          </div>
        </div>
      </div>

      {/* AI System Prompt Box (For Users to feed to AI Assistant) */}
      <div className="glass-card p-6 rounded-xl space-y-4 border border-accent/30 bg-accent/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            <h2 className="font-bold text-base text-foreground">AI Integration System Prompt</h2>
          </div>
          <button
            onClick={() => copyToClipboard(aiIntegrationPrompt, setCopiedPrompt)}
            className="px-3.5 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent transition-colors text-xs flex items-center gap-1.5 font-bold"
          >
            {copiedPrompt ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copiedPrompt ? 'Prompt Copied!' : 'Copy AI Prompt'}</span>
          </button>
        </div>
        <p className="text-xs text-muted">
          Give this prompt to ChatGPT, Claude, Cursor, or Antigravity to automatically connect CentralPay into your existing website code!
        </p>

        <pre className="p-4 rounded-xl bg-[#090C12] border border-card-border font-mono text-xs text-accent whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
          <code>{aiIntegrationPrompt}</code>
        </pre>
      </div>

      {/* 4-Step Developer Integration Overview */}
      <div className="glass-card p-6 rounded-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-card-border pb-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-base text-foreground">4-Step Quick Integration Guidelines</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-card/60 border border-card-border space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">1</span>
              <span>Get Credentials</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Navigate to <strong className="text-foreground">Settings / API Keys</strong> to retrieve your <code className="text-accent">app_id</code> and secret key (<code className="text-accent">cp_live_sec_...</code>).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card/60 border border-card-border space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">2</span>
              <span>Create Checkout Session</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Send a <code className="text-accent">POST /api/v1/payments/create</code> request from your backend with amount & order details. Receive <code className="text-accent">payment_url</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card/60 border border-card-border space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">3</span>
              <span>Redirect Customer</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Redirect your customer to <code className="text-accent">payment_url</code>. They enter sender mobile, send money to your bKash/Nagad/Rocket number, and submit TrxID.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card/60 border border-card-border space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">4</span>
              <span>Auto-Verification & Webhooks</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              CentralPay Agent verifies the SMS in 2-5 seconds, completes the order, redirects customer back to your website, and triggers a real-time Webhook.
            </p>
          </div>
        </div>
      </div>

      {/* Code Snippet Tabs */}
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-accent" />
            <h2 className="font-bold text-base text-foreground">Backend Code Examples</h2>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#090C12] border border-card-border">
            {(['node', 'php', 'python', 'curl'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                  activeTab === tab
                    ? 'bg-primary text-background shadow-md'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          {activeTab === 'node' && (
            <div>
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => copyToClipboard(sampleNodeCode, setCopiedNode)}
                  className="px-3 py-1 rounded-lg bg-card-border hover:bg-primary/20 text-muted hover:text-primary transition-colors text-xs flex items-center gap-1 font-medium"
                >
                  {copiedNode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedNode ? 'Copied' : 'Copy Node.js Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#090C12] border border-card-border font-mono text-xs text-accent overflow-x-auto">
                <code>{sampleNodeCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'php' && (
            <div>
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => copyToClipboard(samplePhpCode, setCopiedPhp)}
                  className="px-3 py-1 rounded-lg bg-card-border hover:bg-primary/20 text-muted hover:text-primary transition-colors text-xs flex items-center gap-1 font-medium"
                >
                  {copiedPhp ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPhp ? 'Copied' : 'Copy PHP Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#090C12] border border-card-border font-mono text-xs text-accent overflow-x-auto">
                <code>{samplePhpCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'python' && (
            <div>
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => copyToClipboard(samplePythonCode, setCopiedPython)}
                  className="px-3 py-1 rounded-lg bg-card-border hover:bg-primary/20 text-muted hover:text-primary transition-colors text-xs flex items-center gap-1 font-medium"
                >
                  {copiedPython ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPython ? 'Copied' : 'Copy Python Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#090C12] border border-card-border font-mono text-xs text-accent overflow-x-auto">
                <code>{samplePythonCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'curl' && (
            <div>
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => copyToClipboard(sampleCurlCode, setCopiedCurl)}
                  className="px-3 py-1 rounded-lg bg-card-border hover:bg-primary/20 text-muted hover:text-primary transition-colors text-xs flex items-center gap-1 font-medium"
                >
                  {copiedCurl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCurl ? 'Copied' : 'Copy cURL Command'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#090C12] border border-card-border font-mono text-xs text-accent overflow-x-auto">
                <code>{sampleCurlCode}</code>
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Webhook Signature Tester */}
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-accent" />
            <h2 className="font-bold text-base text-foreground">Live Webhook Simulator & Signature Tester</h2>
          </div>
          <button
            onClick={handleTestWebhook}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-accent text-background font-bold text-xs hover:bg-accent-hover transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,217,255,0.3)] disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            <span>{loading ? 'Simulating...' : 'Run Webhook Delivery Test'}</span>
          </button>
        </div>

        {testResult && (
          <div className="space-y-3 pt-3 border-t border-card-border">
            <div className="flex items-center gap-2 text-xs text-primary font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Simulated Webhook Delivered Successfully</span>
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
