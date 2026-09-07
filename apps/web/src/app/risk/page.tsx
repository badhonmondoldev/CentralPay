'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Check, X, Eye } from 'lucide-react';

export default function RiskPage() {
  const [reviewItems, setReviewItems] = useState([
    {
      id: 'PAY-20260907-00125',
      appName: 'Nabrijan',
      expectedAmount: 1200,
      detectedAmount: 1200,
      transactionId: 'NB7Q91TX01',
      reference: 'NB7Q91',
      riskScore: 35,
      riskLevel: 'MEDIUM',
      reason: 'Missing reference in SMS body; matched by amount + timing',
      time: '15 mins ago',
    },
  ]);

  const handleApprove = (id: string) => {
    setReviewItems(reviewItems.filter((i) => i.id !== id));
  };

  const handleReject = (id: string) => {
    setReviewItems(reviewItems.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Risk Engine & Review Queue</h1>
          <p className="text-xs text-muted">Audit payments flagged with medium or high risk scores before crediting.</p>
        </div>
      </div>

      {reviewItems.length === 0 ? (
        <div className="glass-card p-12 rounded-xl text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-primary mx-auto" />
          <h3 className="font-bold text-foreground text-sm">Review Queue Empty</h3>
          <p className="text-xs text-muted">All incoming payments have passed risk scoring rules without anomalies.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewItems.map((item) => (
            <div key={item.id} className="glass-card p-5 rounded-xl border border-amber-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-card-border pb-3">
                <div>
                  <span className="font-mono font-bold text-accent text-sm">{item.id}</span>
                  <span className="text-xs text-muted ml-2">({item.appName})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 font-semibold text-xs">
                    {item.riskLevel} RISK (Score: {item.riskScore})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-muted block">Expected Amount</span>
                  <span className="font-bold text-foreground">৳{item.expectedAmount}</span>
                </div>
                <div>
                  <span className="text-muted block">Detected Amount</span>
                  <span className="font-bold text-foreground">৳{item.detectedAmount}</span>
                </div>
                <div>
                  <span className="text-muted block">Transaction ID</span>
                  <span className="font-mono font-bold text-foreground">{item.transactionId}</span>
                </div>
                <div>
                  <span className="text-muted block">Reference</span>
                  <span className="font-mono font-bold text-accent">{item.reference}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <strong>Flag Reason:</strong> {item.reason}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleReject(item.id)}
                  className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 font-bold text-xs hover:bg-red-500/30 flex items-center gap-1.5"
                >
                  <X className="h-4 w-4" />
                  <span>Reject Payment</span>
                </button>
                <button
                  onClick={() => handleApprove(item.id)}
                  className="px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs hover:bg-primary-hover flex items-center gap-1.5 shadow-[0_0_15px_rgba(85,181,16,0.3)]"
                >
                  <Check className="h-4 w-4" />
                  <span>Approve Payment</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
