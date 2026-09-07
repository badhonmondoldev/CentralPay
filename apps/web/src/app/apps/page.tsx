'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, Plus, Key, Webhook, ShieldCheck, Globe, Trash2 } from 'lucide-react';

interface AppItem {
  id: string;
  name: string;
  slug: string;
  website_url: string;
  status: 'ACTIVE' | 'DISABLED' | 'SUSPENDED';
  environment: 'LIVE' | 'TEST';
  webhook_url: string;
  created_at: string;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppItem[]>([
    {
      id: 'app_earnspace',
      name: 'EarnSpace',
      slug: 'earnspace',
      website_url: 'https://earnspace.com',
      status: 'ACTIVE',
      environment: 'LIVE',
      webhook_url: 'https://earnspace.com/api/webhooks/centralpay',
      created_at: '2026-09-01',
    },
    {
      id: 'app_nabrijan',
      name: 'Nabrijan',
      slug: 'nabrijan',
      website_url: 'https://nabrijan.io',
      status: 'ACTIVE',
      environment: 'LIVE',
      webhook_url: 'https://nabrijan.io/api/centralpay-webhook',
      created_at: '2026-09-03',
    },
    {
      id: 'app_gamestore',
      name: 'GameStore',
      slug: 'gamestore',
      website_url: 'https://gamestore.bd',
      status: 'ACTIVE',
      environment: 'TEST',
      webhook_url: 'https://gamestore.bd/webhooks',
      created_at: '2026-09-05',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newWebhook, setNewWebhook] = useState('');

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSlug) return;

    const newApp: AppItem = {
      id: `app_${Date.now()}`,
      name: newName,
      slug: newSlug.toLowerCase().replace(/[^a-z0-9]/g, ''),
      website_url: newUrl || 'https://example.com',
      status: 'ACTIVE',
      environment: 'LIVE',
      webhook_url: newWebhook,
      created_at: new Date().toISOString().split('T')[0],
    };

    setApps([newApp, ...apps]);
    setShowAddModal(false);
    setNewName('');
    setNewSlug('');
    setNewUrl('');
    setNewWebhook('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Connected Applications</h1>
          <p className="text-xs text-muted">Manage isolated application credentials, webhooks, and environment scopes.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs hover:bg-primary-hover transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(85,181,16,0.3)]"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Application</span>
        </button>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <div key={app.id} className="glass-card-interactive p-5 rounded-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{app.name}</h3>
                    <p className="text-xs text-muted font-mono">{app.slug}</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 font-semibold text-[10px]">
                  {app.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted pt-2 border-t border-card-border">
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-accent" />
                  <a href={app.website_url} target="_blank" rel="noreferrer" className="hover:underline text-foreground truncate">
                    {app.website_url}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Webhook className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate">{app.webhook_url || 'No Webhook Set'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-card-border flex items-center justify-between text-xs">
              <span className="text-[10px] text-muted">Created: {app.created_at}</span>
              <Link href={`/api-keys?app=${app.id}`} className="text-primary font-semibold hover:underline flex items-center gap-1">
                <Key className="h-3.5 w-3.5" />
                <span>API Keys</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add App Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full border border-card-border space-y-4 shadow-2xl">
            <h2 className="font-bold text-base text-foreground">Register Connected Application</h2>
            <form onSubmit={handleCreateApp} className="space-y-3 text-xs">
              <div>
                <label className="text-muted block mb-1 font-medium">Application Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EarnSpace"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                  }}
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted block mb-1 font-medium">App Slug (Identifier Prefix)</label>
                <input
                  type="text"
                  required
                  placeholder="earnspace"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted block mb-1 font-medium">Website URL</label>
                <input
                  type="url"
                  placeholder="https://earnspace.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted block mb-1 font-medium">Webhook Endpoint URL</label>
                <input
                  type="url"
                  placeholder="https://earnspace.com/api/webhooks/centralpay"
                  value={newWebhook}
                  onChange={(e) => setNewWebhook(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-card border border-card-border text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-background font-bold hover:bg-primary-hover">
                  Create App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
