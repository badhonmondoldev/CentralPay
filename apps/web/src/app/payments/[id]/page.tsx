'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Webhook,
  BookOpen,
  Smartphone,
  Layers,
  Check,
  AlertTriangle,
} from 'lucide-react';

export default function PaymentDetailPage() {
  const params = useParams();
  const paymentId = params.id as string;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/payments" className="p-2 rounded-xl bg-card border border-card-border text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <span>Payment Details</span>
            <span className="font-mono text-accent text-base">{paymentId}</span>
          </h1>
          <p className="text-xs text-muted">Complete correlation trace across detection, matching, risk, ledger, and webhook.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-xl space-y-2">
          <span className="text-xs text-muted">Connected Application</span>
          <div className="font-bold text-foreground text-base">EarnSpace</div>
          <div className="text-xs text-muted font-mono">Order ID: ORDER_1001</div>
        </div>

        <div className="glass-card p-5 rounded-xl space-y-2">
          <span className="text-xs text-muted">Payment Reference & Amount</span>
          <div className="font-extrabold text-foreground text-2xl">
            ৳500.00 <span className="text-xs text-muted font-normal">BDT</span>
          </div>
          <div className="text-xs text-accent font-mono font-bold">Ref: ES8K21</div>
        </div>

        <div className="glass-card p-5 rounded-xl space-y-2">
          <span className="text-xs text-muted">Verification Status & Risk</span>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/40 font-semibold text-xs">
              COMPLETED
            </span>
          </div>
          <div className="text-xs text-primary font-mono font-semibold">Risk Score: 0 (LOW)</div>
        </div>
      </div>

      {/* Timeline Lifecycle Visualization (Requirement 76) */}
      <div className="glass-card p-6 rounded-xl space-y-6">
        <h2 className="font-bold text-base text-foreground">Payment Execution Lifecycle Timeline</h2>

        <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-card-border">
          {/* Step 1: Payment Request Created */}
          <div className="relative pl-10">
            <span className="absolute left-0 top-0.5 h-7 w-7 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold text-xs">
              <Check className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-foreground">1. Payment Request Created</h3>
              <p className="text-xs text-muted">App EarnSpace requested ৳500.00 with reference ES8K21.</p>
              <span className="text-[10px] text-muted font-mono">2026-09-07 10:25:00 UTC</span>
            </div>
          </div>

          {/* Step 2: SMS Detected on Controlled Phone */}
          <div className="relative pl-10">
            <span className="absolute left-0 top-0.5 h-7 w-7 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold text-xs">
              <Smartphone className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-foreground">2. SMS Confirmation Received by CentralPay Agent</h3>
              <p className="text-xs text-muted">Sender: bKash (16247) | TxID: ES8K21TX99 | Cryptographic Fingerprint Validated.</p>
              <span className="text-[10px] text-muted font-mono">2026-09-07 10:28:12 UTC</span>
            </div>
          </div>

          {/* Step 3: Payment Matching Engine */}
          <div className="relative pl-10">
            <span className="absolute left-0 top-0.5 h-7 w-7 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-foreground">3. Multi-Signal Matching Engine Passed</h3>
              <p className="text-xs text-muted">
                Match Score: 95/100 (Amount matched + TxID valid + Reference match + Source trusted + Time window match).
              </p>
              <span className="text-[10px] text-muted font-mono">2026-09-07 10:28:13 UTC</span>
            </div>
          </div>

          {/* Step 4: Immutable Ledger Record */}
          <div className="relative pl-10">
            <span className="absolute left-0 top-0.5 h-7 w-7 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold text-xs">
              <BookOpen className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-foreground">4. Financial Ledger Entry Created</h3>
              <p className="text-xs text-muted">Atomic transaction inserted CREDIT +৳500.00 into app balance ledger.</p>
              <span className="text-[10px] text-muted font-mono">2026-09-07 10:28:13 UTC</span>
            </div>
          </div>

          {/* Step 5: Webhook Outbox Delivery */}
          <div className="relative pl-10">
            <span className="absolute left-0 top-0.5 h-7 w-7 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold text-xs">
              <Webhook className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-foreground">5. Connected App Webhook Notified</h3>
              <p className="text-xs text-muted">
                Delivered payment.completed payload to https://earnspace.com/api/webhooks/centralpay (HTTP 200 OK).
              </p>
              <span className="text-[10px] text-muted font-mono">2026-09-07 10:28:14 UTC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
