'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Smartphone,
  Webhook,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const volumeChartData = [
  { time: '00:00', volume: 1200 },
  { time: '04:00', volume: 800 },
  { time: '08:00', volume: 4500 },
  { time: '12:00', volume: 9800 },
  { time: '16:00', volume: 14200 },
  { time: '20:00', volume: 11500 },
  { time: '23:59', volume: 6200 },
];

const statusDistribution = [
  { name: 'Completed', value: 85, color: '#55B510' },
  { name: 'Pending', value: 10, color: '#00D9FF' },
  { name: 'Review Req.', value: 3, color: '#F59E0B' },
  { name: 'Failed/Expired', value: 2, color: '#EF4444' },
];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalVolume: 485000,
    todayVolume: 48300,
    successfulPayments: 342,
    pendingPayments: 8,
    failedPayments: 3,
    reviewRequired: 2,
    connectedApps: 4,
    activeDevices: 2,
    webhookHealth: 99.8,
  });

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Overview Dashboard</h1>
          <p className="text-xs text-muted">Real-time payment volume, verification status, and device telemetry.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/payment-requests"
            className="px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs hover:bg-primary-hover transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(85,181,16,0.3)]"
          >
            <span>Create Payment Request</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Row (Requirement 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Total Payment Volume</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">৳{metrics.totalVolume.toLocaleString()}</div>
          <div className="text-[11px] text-primary flex items-center gap-1 font-medium">
            <span>Today: ৳{metrics.todayVolume.toLocaleString()}</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Successful Payments</span>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{metrics.successfulPayments}</div>
          <div className="text-[11px] text-muted flex items-center gap-1">
            <span className="text-accent font-medium">{metrics.pendingPayments} Pending</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Review Required</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500">{metrics.reviewRequired}</div>
          <div className="text-[11px] text-muted">Requires manual audit</div>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Active Android Devices</span>
            <Smartphone className="h-4 w-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-foreground">{metrics.activeDevices}</div>
          <div className="text-[11px] text-primary font-medium">Webhook Uptime: {metrics.webhookHealth}%</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Volume Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-foreground">Hourly Payment Volume (24h)</h2>
            <span className="text-xs text-muted font-mono">BDT (৳)</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeChartData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#55B510" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#55B510" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A212D" />
                <XAxis dataKey="time" stroke="#8B93A1" fontSize={11} />
                <YAxis stroke="#8B93A1" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#10141B', borderColor: '#1A212D', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#55B510" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div className="glass-card p-6 rounded-xl space-y-4 flex flex-col justify-between">
          <h2 className="font-bold text-sm text-foreground">Payment Status Breakdown</h2>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#10141B', borderColor: '#1A212D', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {statusDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted">{item.name}:</span>
                <span className="font-bold text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-foreground">Recent Payments</h2>
            <p className="text-xs text-muted">Latest detected and matched transactions.</p>
          </div>
          <Link href="/payments" className="text-xs text-primary hover:underline font-semibold">
            View All Payments →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border text-xs text-muted uppercase font-semibold">
                <th className="py-3 px-4">Payment Ref</th>
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border text-xs">
              <tr className="hover:bg-card-border/30 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-accent">
                  <Link href="/payments/PAY-20260907-00124">ES8K21</Link>
                </td>
                <td className="py-3.5 px-4 font-medium text-foreground">EarnSpace</td>
                <td className="py-3.5 px-4 font-bold text-foreground">৳500.00</td>
                <td className="py-3.5 px-4 text-muted">bKash Personal</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/40 font-semibold text-[10px]">
                    COMPLETED
                  </span>
                </td>
                <td className="py-3.5 px-4 text-primary font-mono font-semibold">LOW (0)</td>
                <td className="py-3.5 px-4 text-muted">2 mins ago</td>
              </tr>
              <tr className="hover:bg-card-border/30 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-accent">
                  <Link href="/payments/PAY-20260907-00125">NB7Q91</Link>
                </td>
                <td className="py-3.5 px-4 font-medium text-foreground">Nabrijan</td>
                <td className="py-3.5 px-4 font-bold text-foreground">৳1,200.00</td>
                <td className="py-3.5 px-4 text-muted">Nagad Personal</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 font-semibold text-[10px]">
                    REVIEW REQUIRED
                  </span>
                </td>
                <td className="py-3.5 px-4 text-amber-500 font-mono font-semibold">MEDIUM (35)</td>
                <td className="py-3.5 px-4 text-muted">15 mins ago</td>
              </tr>
              <tr className="hover:bg-card-border/30 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-accent">
                  <Link href="/payments/PAY-20260907-00126">GS4M82</Link>
                </td>
                <td className="py-3.5 px-4 font-medium text-foreground">GameStore</td>
                <td className="py-3.5 px-4 font-bold text-foreground">৳350.00</td>
                <td className="py-3.5 px-4 text-muted">Rocket Personal</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-full bg-accent/20 text-accent border border-accent/40 font-semibold text-[10px]">
                    WAITING
                  </span>
                </td>
                <td className="py-3.5 px-4 text-muted font-mono">LOW (0)</td>
                <td className="py-3.5 px-4 text-muted">28 mins ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
