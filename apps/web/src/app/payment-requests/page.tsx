'use client';

import React from 'react';
import Link from 'next/link';
import { Send, Plus, ArrowUpRight } from 'lucide-react';

export default function PaymentRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Payment Requests</h1>
          <p className="text-xs text-muted">Active and historical payment requests created by connected applications.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border text-xs text-muted uppercase font-semibold">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">App</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Ref</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border text-xs">
              <tr className="hover:bg-card-border/30 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-foreground">REQ-20260907-001</td>
                <td className="py-3.5 px-4 font-medium text-foreground">EarnSpace</td>
                <td className="py-3.5 px-4 text-muted font-mono">USER_123</td>
                <td className="py-3.5 px-4 font-mono">ORDER_1001</td>
                <td className="py-3.5 px-4 font-bold text-foreground">৳500.00</td>
                <td className="py-3.5 px-4 font-mono font-bold text-accent">ES8K21</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/40 font-semibold text-[10px]">
                    COMPLETED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
