'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CreditCard, Search, Filter, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Payment Verification Log</h1>
          <p className="text-xs text-muted">Complete payments lifecycle from creation to webhook settlement.</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by Payment ID, Ref (e.g. ES8K21), Order ID, or TxID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-card-border text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border text-xs text-muted uppercase font-semibold">
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Ref</th>
                <th className="py-3 px-4">App</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border text-xs">
              <tr className="hover:bg-card-border/30 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-foreground">PAY-20260907-00124</td>
                <td className="py-3.5 px-4 font-mono font-bold text-accent">ES8K21</td>
                <td className="py-3.5 px-4 font-medium text-foreground">EarnSpace</td>
                <td className="py-3.5 px-4 font-bold text-foreground">৳500.00</td>
                <td className="py-3.5 px-4 text-muted">bKash Personal</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/40 font-semibold text-[10px]">
                    COMPLETED
                  </span>
                </td>
                <td className="py-3.5 px-4 text-primary font-mono font-semibold">LOW (0)</td>
                <td className="py-3.5 px-4">
                  <Link
                    href="/payments/PAY-20260907-00124"
                    className="p-1.5 rounded-lg bg-card-border hover:bg-primary/20 text-muted hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    <span>Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
              <tr className="hover:bg-card-border/30 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-foreground">PAY-20260907-00125</td>
                <td className="py-3.5 px-4 font-mono font-bold text-accent">NB7Q91</td>
                <td className="py-3.5 px-4 font-medium text-foreground">Nabrijan</td>
                <td className="py-3.5 px-4 font-bold text-foreground">৳1,200.00</td>
                <td className="py-3.5 px-4 text-muted">Nagad Personal</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 font-semibold text-[10px]">
                    REVIEW REQUIRED
                  </span>
                </td>
                <td className="py-3.5 px-4 text-amber-500 font-mono font-semibold">MEDIUM (35)</td>
                <td className="py-3.5 px-4">
                  <Link
                    href="/payments/PAY-20260907-00125"
                    className="p-1.5 rounded-lg bg-card-border hover:bg-amber-500/20 text-muted hover:text-amber-500 transition-colors inline-flex items-center gap-1"
                  >
                    <span>Audit</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
