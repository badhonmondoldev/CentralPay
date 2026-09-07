'use client';

import React, { useState } from 'react';
import { Settings, ShieldAlert, AlertTriangle, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const [safeMode, setSafeMode] = useState(false);
  const [autoApproval, setAutoApproval] = useState(true);
  const [minConfidence, setMinConfidence] = useState(80);
  const [maxAutoAmount, setMaxAutoAmount] = useState(50000);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">System Settings & Risk Controls</h1>
        <p className="text-xs text-muted">Configure auto-approval thresholds, heartbeat timings, and emergency controls.</p>
      </div>

      {/* Emergency Controls (Requirement 53) */}
      <div className="glass-card p-6 rounded-xl border border-red-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">EMERGENCY CONTROL: SAFE MODE</h2>
              <p className="text-xs text-muted">
                Safe Mode disables all automatic approvals immediately. Every payment requires manual review.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSafeMode(!safeMode)}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              safeMode
                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-card border border-card-border text-muted hover:text-foreground'
            }`}
          >
            {safeMode ? 'SAFE MODE ACTIVE' : 'ENABLE SAFE MODE'}
          </button>
        </div>
      </div>

      {/* Verification Parameters Form */}
      <form onSubmit={handleSave} className="glass-card p-6 rounded-xl space-y-6">
        <h2 className="font-bold text-base text-foreground border-b border-card-border pb-3">Automated Verification Rules</h2>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-bold text-foreground block">Auto Approval Enabled</label>
              <p className="text-muted">Allow multi-signal matched transactions (score &ge; 90) to complete automatically.</p>
            </div>
            <input
              type="checkbox"
              checked={autoApproval}
              onChange={(e) => setAutoApproval(e.target.checked)}
              className="h-5 w-5 rounded bg-card border-card-border text-primary focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-foreground block">Minimum Confidence Score for Matching (0 - 100)</label>
            <input
              type="number"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseInt(e.target.value, 10))}
              className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground font-mono focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-foreground block">Maximum Auto-Approval Amount (BDT)</label>
            <input
              type="number"
              value={maxAutoAmount}
              onChange={(e) => setMaxAutoAmount(parseInt(e.target.value, 10))}
              className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground font-mono focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-card-border flex items-center justify-between">
          {saved ? (
            <span className="text-xs text-primary font-bold flex items-center gap-1">
              <Check className="h-4 w-4" />
              <span>Settings Saved Successfully</span>
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-background font-bold text-xs hover:bg-primary-hover transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(85,181,16,0.3)]"
          >
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
