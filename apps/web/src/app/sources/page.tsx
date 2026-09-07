'use client';

import React, { useState } from 'react';
import { Radio, Plus, Smartphone } from 'lucide-react';

export default function PaymentSourcesPage() {
  const [sources, setSources] = useState([
    {
      id: 'src_bkash_01',
      name: 'bKash Personal Account',
      provider: 'bKash',
      accountNumber: '01700000000',
      type: 'Personal',
      priority: 1,
      isActive: true,
    },
    {
      id: 'src_nagad_01',
      name: 'Nagad Personal Account',
      provider: 'Nagad',
      accountNumber: '01800000000',
      type: 'Personal',
      priority: 2,
      isActive: true,
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Payment Sources</h1>
          <p className="text-xs text-muted">Configure personal payment numbers (bKash, Nagad, Rocket, Custom).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => (
          <div key={src.id} className="glass-card p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{src.name}</h3>
                  <p className="text-xs text-muted font-mono">{src.provider} ({src.type})</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 font-semibold text-[10px]">
                ACTIVE
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#090C12] border border-card-border font-mono font-bold text-foreground text-sm flex items-center justify-between">
              <span>{src.accountNumber}</span>
              <span className="text-xs text-muted font-sans font-normal">Priority: #{src.priority}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
