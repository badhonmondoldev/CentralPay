'use client';

import React from 'react';
import { Bell, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">System Alerts & Security Warnings</h1>
        <p className="text-xs text-muted">Device heartbeats, risk reviews, and webhook failure notifications.</p>
      </div>

      <div className="space-y-3">
        <div className="glass-card p-4 rounded-xl border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-sm text-foreground">Payment Review Required</h3>
              <p className="text-xs text-muted">Payment PAY-20260907-00125 flagged due to missing reference code.</p>
            </div>
          </div>
          <span className="text-[10px] text-muted font-mono">15 mins ago</span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-primary/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-bold text-sm text-foreground">Device Heartbeat Normal</h3>
              <p className="text-xs text-muted">Android Agent Primary (Pixel 7) connected cleanly.</p>
            </div>
          </div>
          <span className="text-[10px] text-muted font-mono">30 secs ago</span>
        </div>
      </div>
    </div>
  );
}
