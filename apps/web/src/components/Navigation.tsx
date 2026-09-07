'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Send,
  Layers,
  Smartphone,
  ArrowRightLeft,
  BookOpen,
  Webhook,
  ShieldAlert,
  BarChart3,
  Code2,
  Key,
  FileText,
  Settings,
  Bell,
  Home,
  CheckCircle2,
  Radio,
  Zap,
} from 'lucide-react';

const desktopNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Payment Requests', href: '/payment-requests', icon: Send },
  { name: 'Applications', href: '/apps', icon: Layers },
  { name: 'Payment Sources', href: '/sources', icon: Radio },
  { name: 'Devices', href: '/devices', icon: Smartphone },
  { name: 'Transactions', href: '/transactions', icon: ArrowRightLeft },
  { name: 'Ledger', href: '/ledger', icon: BookOpen },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook },
  { name: 'Risk & Security', href: '/risk', icon: ShieldAlert },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Developer', href: '/developer', icon: Code2 },
  { name: 'API Keys', href: '/api-keys', icon: Key },
  { name: 'Logs', href: '/logs', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const mobileNavItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Apps', href: '/apps', icon: Layers },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide sidebar/nav on hosted checkout pages (/pay/[id]) and login page
  const isCheckoutOrLogin = pathname.startsWith('/pay/') || pathname === '/login';

  if (isCheckoutOrLogin) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-card-border bg-[#090C12] p-4 fixed top-0 bottom-0 left-0 z-40 overflow-y-auto">
        <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-card-border">
          <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold shadow-[0_0_15px_rgba(85,181,16,0.3)]">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground tracking-tight flex items-center gap-1.5">
              CENTRALPAY <span className="text-xs px-1.5 py-0.5 rounded bg-primary text-background font-black">MAX</span>
            </h1>
            <p className="text-xs text-muted">Private Payment Core</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {desktopNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                    : 'text-muted hover:text-foreground hover:bg-card-border/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* System Status Banner */}
        <div className="mt-auto pt-4 border-t border-card-border">
          <div className="glass-card p-3 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-foreground font-medium">System Active</span>
            </div>
            <span className="text-[10px] text-muted bg-card-border px-1.5 py-0.5 rounded">Agent Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-card-border bg-[#090C12]/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">CENTRALPAY MAX</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-muted">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span>Multi-App SMS Verification Network</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/alerts"
              className="p-2 rounded-lg bg-card hover:bg-card-border border border-card-border text-muted hover:text-foreground transition-colors relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
            </Link>
            <div className="h-8 px-3 rounded-lg bg-card border border-card-border flex items-center gap-2 text-xs font-mono text-foreground">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>LIVE MODE</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 max-w-7xl mx-auto w-full">{children}</main>

        {/* Mobile Bottom Navigation Bar (Requirement 5) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#090C12]/95 backdrop-blur-lg border-t border-card-border z-50 flex items-center justify-around px-2">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full text-[11px] font-medium transition-colors ${
                  isActive ? 'text-primary font-semibold' : 'text-muted'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
