'use client';

import React from 'react';
import { FileText, Search } from 'lucide-react';

export default function LogsPage() {
  const logs = [
    {
      id: 'log_01',
      correlationId: 'PAY-20260907-00124',
      category: 'PAYMENT',
      action: 'complete_payment_atomically',
      details: 'Atomic transaction committed: status COMPLETED, ledger CREDIT +৳500.00',
      timestamp: '2026-09-07 10:28:13.402 UTC',
    },
    {
      id: 'log_02',
      correlationId: 'PAY-20260907-00124',
      category: 'WEBHOOK',
      action: 'deliver_webhook',
      details: 'Signature X-CentralPay-Signature generated and delivered to EarnSpace endpoint (200 OK)',
      timestamp: '2026-09-07 10:28:14.110 UTC',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Structured Security & System Trace Logs</h1>
        <p className="text-xs text-muted">Correlated end-to-end log entries across API, SMS, Matching, Ledger, and Webhooks.</p>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-card-border text-muted uppercase font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Correlation ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Trace Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-card-border/30 transition-colors">
                  <td className="py-3.5 px-4 text-muted font-mono text-[11px]">{l.timestamp}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-accent">{l.correlationId}</td>
                  <td className="py-3.5 px-4 font-semibold text-primary">{l.category}</td>
                  <td className="py-3.5 px-4 font-mono text-foreground">{l.action}</td>
                  <td className="py-3.5 px-4 text-muted truncate max-w-md">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
