'use client';

import React from 'react';
import { BookOpen, TrendingUp, ShieldCheck } from 'lucide-react';

export default function LedgerPage() {
  const ledgerEntries = [
    {
      id: 'led_001',
      paymentId: 'PAY-20260907-00124',
      appName: 'EarnSpace',
      amount: 500,
      currency: 'BDT',
      type: 'CREDIT',
      balanceSnapshot: 485000,
      description: 'Verified payment received via SMS confirmation',
      createdAt: '2026-09-07 10:28:13 UTC',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Immutable Financial Ledger</h1>
          <p className="text-xs text-muted">Audit trail of all verified payment credits and compensating entries.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border text-xs text-muted uppercase font-semibold">
                <th className="py-3 px-4">Ledger ID</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Balance Snapshot</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border text-xs">
              {ledgerEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-card-border/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">{entry.id}</td>
                  <td className="py-3.5 px-4 font-mono text-accent font-semibold">{entry.paymentId}</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">{entry.appName}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/40 font-semibold text-[10px]">
                      +{entry.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-foreground">৳{entry.amount.toLocaleString()}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-primary">৳{entry.balanceSnapshot.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-muted font-mono text-[11px]">{entry.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
