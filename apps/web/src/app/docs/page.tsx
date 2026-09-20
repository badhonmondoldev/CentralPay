'use client';

import React, { useState } from 'react';
import {
  Code2,
  Key,
  Webhook,
  Shield,
  CreditCard,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  Terminal,
  Zap,
  BookOpen,
} from 'lucide-react';

type LangTab = 'curl' | 'nodejs' | 'php' | 'python' | 'nextjs';

export default function DeveloperDocsPage() {
  const [activeLang, setActiveLang] = useState<LangTab>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const codeSnippets: Record<LangTab, { createPayment: string; verifyWebhook: string }> = {
    curl: {
      createPayment: `curl -X POST https://centralpay-xi.vercel.app/api/v1/payment-requests \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: idemp_\${Date.now()}" \\
  -d '{
    "amount": 500.00,
    "currency": "BDT",
    "order_id": "ORD-9921",
    "description": "Pro VIP Subscription",
    "customer_id": "user_882",
    "redirect_url": "https://yourwebsite.com/payment/callback"
  }'`,
      verifyWebhook: `# Verify X-CentralPay-Signature using HMAC SHA-256
echo -n "timestamp.eventId.payload" | openssl dgst -sha256 -hmac "YOUR_WEBHOOK_SECRET"`,
    },
    nodejs: {
      createPayment: `import axios from 'axios';

const response = await axios.post('https://centralpay-xi.vercel.app/api/v1/payment-requests', {
  amount: 500.00,
  order_id: 'ORD-9921',
  description: 'Pro VIP Subscription',
  customer_id: 'user_882',
  redirect_url: 'https://yourwebsite.com/payment/callback'
}, {
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': \`idemp_\${Date.now()}\`
  }
});

console.log('Payment URL:', response.data.data.paymentUrl);`,
      verifyWebhook: `import crypto from 'crypto';

function verifyWebhook(payload, signature, secret, timestamp, eventId) {
  const dataToSign = \`\${timestamp}.\${eventId}.\${payload}\`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}`,
    },
    php: {
      createPayment: `<?php
$ch = curl_init('https://centralpay-xi.vercel.app/api/v1/payment-requests');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Idempotency-Key: ' . uniqid('idemp_')
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'amount' => 500.00,
    'order_id' => 'ORD-9921',
    'description' => 'Pro VIP Subscription',
    'customer_id' => 'user_882',
    'redirect_url' => 'https://yourwebsite.com/payment/callback'
]));

$response = json_decode(curl_exec($ch), true);
curl_close($ch);

header('Location: ' . $response['data']['paymentUrl']);
exit;`,
      verifyWebhook: `<?php
$signature = $_SERVER['HTTP_X_CENTRALPAY_SIGNATURE'];
$timestamp = $_SERVER['HTTP_X_CENTRALPAY_TIMESTAMP'];
$eventId = $_SERVER['HTTP_X_CENTRALPAY_EVENT_ID'];
$payload = file_get_contents('php://input');

$expected = hash_hmac('sha256', "$timestamp.$eventId.$payload", 'YOUR_WEBHOOK_SECRET');

if (hash_equals($expected, $signature)) {
    // Verified payment webhook
    http_response_code(200);
}`,
    },
    python: {
      createPayment: `import requests, time

response = requests.post(
    'https://centralpay-xi.vercel.app/api/v1/payment-requests',
    json={
        'amount': 500.00,
        'order_id': 'ORD-9921',
        'description': 'Pro VIP Subscription',
        'customer_id': 'user_882',
        'redirect_url': 'https://yourwebsite.com/payment/callback'
    },
    headers={
        'Content-Type': 'application/json',
        'Idempotency-Key': f'idemp_{int(time.time())}'
    }
)

payment_url = response.json()['data']['paymentUrl']
print('Redirect buyer to:', payment_url)`,
      verifyWebhook: `import hmac, hashlib

def verify_signature(payload, signature, secret, timestamp, event_id):
    data_to_sign = f'{timestamp}.{event_id}.{payload}'.encode('utf-8')
    expected = hmac.new(secret.encode('utf-8'), data_to_sign, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)`,
    },
    nextjs: {
      createPayment: `// app/api/checkout/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const res = await fetch('https://centralpay-xi.vercel.app/api/v1/payment-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': \`idemp_\${Date.now()}\`
    },
    body: JSON.stringify({
      amount: 500.00,
      order_id: 'ORD-9921',
      description: 'Pro VIP Subscription',
      redirect_url: 'https://yourwebsite.com/payment/callback'
    })
  });

  const { data } = await res.json();
  return NextResponse.redirect(data.paymentUrl);
}`,
      verifyWebhook: `// app/api/centralpay-webhook/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  const signature = req.headers.get('x-centralpay-signature') || '';
  const timestamp = req.headers.get('x-centralpay-timestamp') || '';
  const eventId = req.headers.get('x-centralpay-event-id') || '';
  const rawPayload = await req.text();

  const secret = process.env.CENTRALPAY_WEBHOOK_SECRET!;
  const expected = crypto.createHmac('sha256', secret).update(\`\${timestamp}.\${eventId}.\${rawPayload}\`).digest('hex');

  if (signature !== expected) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(rawPayload);
  if (event.event_type === 'payment.completed') {
    // Fulfill customer order in database
  }

  return NextResponse.json({ received: true });
}`,
    },
  };

  return (
    <div className="min-h-screen bg-[#0A0D12] text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary font-mono text-sm tracking-wider uppercase mb-1">
              <Zap className="h-4 w-4" /> CentralPay MAX Developer Platform
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">API & Integration Docs</h1>
            <p className="text-slate-400 mt-1">Enterprise-grade MFS automated payment infrastructure, idempotency & webhooks.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
              API Version: v1 (Active)
            </span>
            <a
              href="https://centralpay-xi.vercel.app/health"
              target="_blank"
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 flex items-center gap-1.5 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Core Status: UP
            </a>
          </div>
        </div>

        {/* Quick Reference Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121721] border border-white/10 p-5 rounded-2xl">
            <div className="p-2 w-fit bg-primary/10 text-primary rounded-lg mb-3">
              <Terminal className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Base URL</h3>
            <p className="text-xs text-slate-400 mt-1 mb-3">Production REST API Gateway endpoint</p>
            <code className="text-xs font-mono bg-black/50 p-2 rounded block text-emerald-400 border border-white/5">
              https://centralpay-xi.vercel.app/api/v1
            </code>
          </div>

          <div className="bg-[#121721] border border-white/10 p-5 rounded-2xl">
            <div className="p-2 w-fit bg-amber-500/10 text-amber-400 rounded-lg mb-3">
              <Key className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Idempotency-Key</h3>
            <p className="text-xs text-slate-400 mt-1 mb-3">Guarantees safe retries without double-charging</p>
            <code className="text-xs font-mono bg-black/50 p-2 rounded block text-amber-300 border border-white/5">
              Header: Idempotency-Key: &lt;uuid&gt;
            </code>
          </div>

          <div className="bg-[#121721] border border-white/10 p-5 rounded-2xl">
            <div className="p-2 w-fit bg-purple-500/10 text-purple-400 rounded-lg mb-3">
              <Webhook className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Webhook Signing</h3>
            <p className="text-xs text-slate-400 mt-1 mb-3">HMAC-SHA256 signature verification</p>
            <code className="text-xs font-mono bg-black/50 p-2 rounded block text-purple-300 border border-white/5">
              Header: X-CentralPay-Signature
            </code>
          </div>
        </div>

        {/* Code Tabs */}
        <div className="bg-[#121721] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-4 py-3 bg-black/30">
            <div className="flex items-center gap-1">
              {(['curl', 'nodejs', 'php', 'python', 'nextjs'] as LangTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveLang(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    activeLang === tab
                      ? 'bg-primary text-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-mono">1. Create Payment Request</span>
          </div>

          <div className="p-6">
            <div className="relative">
              <button
                onClick={() => copyCode('create', codeSnippets[activeLang].createPayment)}
                className="absolute right-3 top-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 text-xs flex items-center gap-1.5 transition"
              >
                {copiedKey === 'create' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copiedKey === 'create' ? 'Copied' : 'Copy'}
              </button>
              <pre className="text-xs md:text-sm font-mono bg-[#090C10] p-4 rounded-xl text-slate-300 overflow-x-auto border border-white/5 leading-relaxed">
                <code>{codeSnippets[activeLang].createPayment}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Webhook Verification Example */}
        <div className="bg-[#121721] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-black/30">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-400" /> 2. Webhook Signature Verification
            </h3>
            <span className="text-xs text-slate-400 font-mono">{activeLang.toUpperCase()}</span>
          </div>

          <div className="p-6">
            <div className="relative">
              <button
                onClick={() => copyCode('webhook', codeSnippets[activeLang].verifyWebhook)}
                className="absolute right-3 top-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 text-xs flex items-center gap-1.5 transition"
              >
                {copiedKey === 'webhook' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copiedKey === 'webhook' ? 'Copied' : 'Copy'}
              </button>
              <pre className="text-xs md:text-sm font-mono bg-[#090C10] p-4 rounded-xl text-slate-300 overflow-x-auto border border-white/5 leading-relaxed">
                <code>{codeSnippets[activeLang].verifyWebhook}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* State Machine Overview */}
        <div className="bg-[#121721] border border-white/10 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Payment State Machine Lifecycle
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-blue-400 font-bold block mb-1">WAITING_PAYMENT</span>
              Buyer initiated checkout, awaiting money transfer.
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-amber-400 font-bold block mb-1">VERIFYING</span>
              Customer submitted TrxID, matching with SMS.
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-emerald-400 font-bold block mb-1">COMPLETED</span>
              Verified & credited. Immutable ledger updated.
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-rose-400 font-bold block mb-1">EXPIRED / REFUNDED</span>
              Session timed out or funds returned to customer.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
