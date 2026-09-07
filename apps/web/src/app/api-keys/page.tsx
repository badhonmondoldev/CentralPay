'use client';

import React, { useState } from 'react';
import { Key, Plus, RefreshCw, Trash2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface KeyItem {
  id: string;
  name: string;
  appName: string;
  prefix: string;
  env: 'LIVE' | 'TEST';
  type: 'secret' | 'publishable';
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<KeyItem[]>([
    {
      id: 'key_01',
      name: 'EarnSpace Backend Secret Key',
      appName: 'EarnSpace',
      prefix: 'cp_live_sec_7a8b...',
      env: 'LIVE',
      type: 'secret',
      createdAt: '2026-09-01',
    },
    {
      id: 'key_02',
      name: 'EarnSpace Test Key',
      appName: 'EarnSpace',
      prefix: 'cp_test_sec_1a2b...',
      env: 'TEST',
      type: 'secret',
      createdAt: '2026-09-01',
    },
  ]);

  const [newCreatedKey, setNewCreatedKey] = useState<string | null>(null);

  const handleGenerateKey = () => {
    const rawKey = `cp_live_sec_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    setNewCreatedKey(rawKey);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">API Key Management</h1>
          <p className="text-xs text-muted">Create, rotate, and scope publishable and secret keys for connected applications.</p>
        </div>
        <button
          onClick={handleGenerateKey}
          className="px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs hover:bg-primary-hover transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(85,181,16,0.3)]"
        >
          <Plus className="h-4 w-4" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {newCreatedKey && (
        <div className="p-4 rounded-xl bg-primary/20 border border-primary/40 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-primary font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span>New Secret Key Generated - Copy Now</span>
          </div>
          <p className="text-muted text-[11px]">This secret key will never be displayed in plain text again.</p>
          <div className="p-3 rounded-lg bg-[#090C12] font-mono font-bold text-primary border border-card-border text-sm">
            {newCreatedKey}
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border text-xs text-muted uppercase font-semibold">
                <th className="py-3 px-4">Key Name</th>
                <th className="py-3 px-4">App</th>
                <th className="py-3 px-4">Key Prefix</th>
                <th className="py-3 px-4">Env</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border text-xs">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-card-border/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">{k.name}</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">{k.appName}</td>
                  <td className="py-3.5 px-4 font-mono text-accent">{k.prefix}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        k.env === 'LIVE' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                      }`}
                    >
                      {k.env}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-muted capitalize">{k.type}</td>
                  <td className="py-3.5 px-4 text-muted">{k.createdAt}</td>
                  <td className="py-3.5 px-4">
                    <button className="p-1.5 rounded-lg bg-card-border hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
