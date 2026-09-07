'use client';

import React, { useState } from 'react';
import { Webhook, RefreshCw, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';

export default function WebhooksPage() {
  const [deliveries, setDeliveries] = useState([
    {
      id: 'del_001',
      eventId: 'evt_991',
      appName: 'EarnSpace',
      targetUrl: 'https://earnspace.com/api/webhooks/centralpay',
      status: 'SUCCESS',
      attempts: 1,
      responseCode: 200,
      timestamp: '2 mins ago',
    },
    {
      id: 'del_002',
      eventId: 'evt_992',
      appName: 'Nabrijan',
      targetUrl: 'https://nabrijan.io/api/centralpay-webhook',
      status: 'FAILED',
      attempts: 3,
      responseCode: 504,
      timestamp: '18 mins ago',
    },
  ]);

  const handleRetry = (id: string) => {
    setDeliveries(
      deliveries.map((d) => (d.id === id ? { ...d, status: 'SUCCESS', responseCode: 200, attempts: d.attempts + 1 } : d))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Webhook Outbox Delivery Queue</h1>
          <p className="text-xs text-muted">Monitor outgoing signed webhooks and trigger manual retries with backoff.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border text-xs text-muted uppercase font-semibold">
                <th className="py-3 px-4">Delivery ID</th>
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Target URL</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">HTTP</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border text-xs">
              {deliveries.map((del) => (
                <tr key={del.id} className="hover:bg-card-border/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">{del.id}</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">{del.appName}</td>
                  <td className="py-3.5 px-4 text-muted font-mono truncate max-w-xs">{del.targetUrl}</td>
                  <td className="py-3.5 px-4">
                    {del.status === 'SUCCESS' ? (
                      <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/40 font-semibold text-[10px]">
                        SUCCESS
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-semibold text-[10px]">
                        FAILED
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">{del.responseCode}</td>
                  <td className="py-3.5 px-4 text-muted font-mono">{del.attempts}</td>
                  <td className="py-3.5 px-4 text-muted">{del.timestamp}</td>
                  <td className="py-3.5 px-4">
                    {del.status !== 'SUCCESS' && (
                      <button
                        onClick={() => handleRetry(del.id)}
                        className="px-2.5 py-1 rounded-lg bg-card-border hover:bg-primary/20 text-muted hover:text-primary transition-colors inline-flex items-center gap-1 font-semibold"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
