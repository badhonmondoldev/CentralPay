'use client';

import React from 'react';
import { ArrowRightLeft } from 'lucide-react';

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Parsed SMS Transactions</h1>
        <p className="text-xs text-muted">Extracted structured payment data received from Android companion agent.</p>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-card-border text-muted uppercase font-semibold">
                <th className="py-3 px-4">TxID</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Ref Code</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Received Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              <tr className="hover:bg-card-border/30 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-foreground">ES8K21TX99</td>
                <td className="py-3.5 px-4 font-medium text-foreground">bKash</td>
                <td className="py-3.5 px-4 font-bold text-foreground">৳500.00</td>
                <td className="py-3.5 px-4 font-mono text-accent font-bold">ES8K21</td>
                <td className="py-3.5 px-4 text-primary font-mono font-semibold">90%</td>
                <td className="py-3.5 px-4 text-muted font-mono">2026-09-07 10:28:12 UTC</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
