'use client';

import React from 'react';
import { BarChart3, TrendingUp, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const appPerformance = [
  { name: 'EarnSpace', volume: 280000 },
  { name: 'Nabrijan', volume: 145000 },
  { name: 'GameStore', volume: 60000 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Infrastructure Analytics</h1>
        <p className="text-xs text-muted">Application-wise volume breakdown, average verification latency, and uptime performance.</p>
      </div>

      <div className="glass-card p-6 rounded-xl space-y-4">
        <h2 className="font-bold text-sm text-foreground">Application Volume Breakdown (BDT)</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A212D" />
              <XAxis dataKey="name" stroke="#8B93A1" fontSize={11} />
              <YAxis stroke="#8B93A1" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#10141B', borderColor: '#1A212D', borderRadius: '8px' }} />
              <Bar dataKey="volume" fill="#00D9FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
