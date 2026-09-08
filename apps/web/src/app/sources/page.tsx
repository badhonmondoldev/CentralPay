'use client';

import React, { useState, useEffect } from 'react';
import { Radio, Plus, Edit2, Check, Smartphone, Trash2, Power, AlertCircle, RefreshCw } from 'lucide-react';

interface PaymentSourceItem {
  id: string;
  name: string;
  provider_label: 'bKash' | 'Nagad' | 'Rocket' | 'Custom';
  account_number: string;
  account_type: 'personal' | 'agent' | 'merchant';
  currency: string;
  instructions?: string;
  priority: number;
  is_active: boolean;
}

export default function PaymentSourcesPage() {
  const [sources, setSources] = useState<PaymentSourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [editingSource, setEditingSource] = useState<PaymentSourceItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for Add / Edit
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Custom'>('bKash');
  const [formNumber, setFormNumber] = useState('');
  const [formType, setFormType] = useState<'personal' | 'agent' | 'merchant'>('personal');
  const [formPriority, setFormPriority] = useState(1);
  const [formInstructions, setFormInstructions] = useState('');

  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/sources');
      if (res.ok) {
        const data = await res.json();
        if (data.sources && data.sources.length > 0) {
          setSources(data.sources);
        } else {
          // Default fallback
          setSources([
            {
              id: '22222222-2222-2222-2222-222222222222',
              name: 'bKash Personal Account',
              provider_label: 'bKash',
              account_number: '01700000000',
              account_type: 'personal',
              currency: 'BDT',
              priority: 1,
              is_active: true,
              instructions: 'Send Money to our bKash personal number using Send Money option.',
            },
            {
              id: '33333333-3333-3333-3333-333333333333',
              name: 'Nagad Personal Account',
              provider_label: 'Nagad',
              account_number: '01800000000',
              account_type: 'personal',
              currency: 'BDT',
              priority: 2,
              is_active: true,
              instructions: 'Send Money to our Nagad personal number using Send Money option.',
            },
          ]);
        }
      }
    } catch (e) {
      console.error('Failed to load sources', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const openEditModal = (src: PaymentSourceItem) => {
    setEditingSource(src);
    setFormName(src.name);
    setFormProvider(src.provider_label);
    setFormNumber(src.account_number);
    setFormType(src.account_type);
    setFormPriority(src.priority);
    setFormInstructions(src.instructions || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource || !formNumber) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/sources/${editingSource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          provider_label: formProvider,
          account_number: formNumber.trim(),
          account_type: formType,
          priority: formPriority,
          instructions: formInstructions,
        }),
      });

      if (res.ok) {
        await loadSources();
        setEditingSource(null);
        setToastMessage(`নম্বর সফলভাবে আপডেট হয়েছে! (${formNumber.trim()})`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert('ডেটাবেজে সেভ করতে সমস্যা হয়েছে।');
      }
    } catch {
      alert('নেটওয়ার্ক সমস্যার কারণে সেভ হয়নি।');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNumber) return;

    setSaving(true);
    try {
      const res = await fetch('/api/v1/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName || `${formProvider} Personal Account`,
          provider_label: formProvider,
          account_number: formNumber.trim(),
          account_type: formType,
          priority: formPriority,
          currency: 'BDT',
          instructions: formInstructions || `Send Money to ${formNumber.trim()} using ${formProvider}`,
        }),
      });

      if (res.ok) {
        await loadSources();
        setShowAddModal(false);
        setFormName('');
        setFormNumber('');
        setFormInstructions('');
        setToastMessage(`নতুন ${formProvider} নম্বর সফলভাবে যোগ করা হয়েছে!`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert('নম্বর যোগ করতে সমস্যা হয়েছে।');
      }
    } catch {
      alert('নেটওয়ার্ক সমস্যার কারণে নম্বর যোগ করা যায়নি।');
    } finally {
      setSaving(false);
    }
  };

  const toggleSourceActive = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/v1/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      await loadSources();
      setToastMessage(currentActive ? 'নম্বর নিষ্ক্রিয় (Inactive) করা হয়েছে' : 'নম্বর সক্রিয় (Active) করা হয়েছে');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই পেমেন্ট নম্বরটি মুছে ফেলতে চান?')) return;

    try {
      const res = await fetch(`/api/v1/sources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadSources();
        setToastMessage('পেমেন্ট নম্বর মুছে ফেলা হয়েছে!');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-primary/20 border border-primary/40 text-primary font-semibold text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-primary hover:underline text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Payment Sources & Account Numbers</h1>
          <p className="text-xs text-muted">
            Configure your personal payment numbers (bKash, Nagad, Rocket). Changes are immediately live on the payment checkout page!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSources}
            className="p-2 rounded-xl bg-card border border-card-border text-muted hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setFormName('');
              setFormNumber('');
              setFormInstructions('');
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs hover:bg-primary-hover transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(85,181,16,0.3)]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Payment Number</span>
          </button>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => (
          <div key={src.id} className="glass-card p-5 rounded-xl space-y-4 flex flex-col justify-between border border-card-border">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{src.name}</h3>
                    <p className="text-xs text-muted capitalize font-mono">
                      {src.provider_label} ({src.account_type})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSourceActive(src.id, src.is_active)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      src.is_active
                        ? 'bg-primary/20 border-primary/40 text-primary'
                        : 'bg-card border-card-border text-muted hover:text-foreground'
                    }`}
                    title="Toggle Active/Inactive"
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <span
                    className={`px-2.5 py-0.5 rounded-full border font-semibold text-[10px] ${
                      src.is_active
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'bg-card-border text-muted border-card-border'
                    }`}
                  >
                    {src.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>

              {/* Number Box */}
              <div className="p-3.5 rounded-xl bg-[#090C12] border border-card-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted block uppercase">Configured Send Money Number</span>
                  <span className="font-mono font-black text-foreground text-lg tracking-wide">{src.account_number}</span>
                </div>
                <span className="text-xs text-muted font-sans font-semibold">Priority #{src.priority}</span>
              </div>

              {src.instructions && <p className="text-[11px] text-muted italic leading-relaxed">"{src.instructions}"</p>}
            </div>

            <div className="pt-3 border-t border-card-border flex items-center justify-between text-xs">
              <span className="text-[10px] text-muted">Currency: {src.currency}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(src.id)}
                  className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete Number"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openEditModal(src)}
                  className="px-3 py-1.5 rounded-lg bg-card-border hover:bg-primary/20 text-muted hover:text-primary transition-colors flex items-center gap-1.5 font-semibold text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Number</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Payment Source Modal */}
      {editingSource && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full border border-card-border space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-card-border pb-3">
              <h2 className="font-bold text-base text-foreground">Edit Payment Number</h2>
              <span className="text-xs text-accent font-mono">{editingSource.provider_label}</span>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="text-muted block mb-1 font-medium">Source Display Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted block mb-1 font-medium">Provider Label</label>
                <select
                  value={formProvider}
                  onChange={(e) => setFormProvider(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="text-muted block mb-1 font-medium">
                  Payment Account Number (e.g. 017XXXXXXXX) <span className="text-primary font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="017XXXXXXXX"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#090C12] border border-primary/40 font-mono text-foreground font-bold text-base focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted block mb-1 font-medium">Account Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="personal">Personal (Send Money)</option>
                    <option value="agent">Agent (Cash Out)</option>
                    <option value="merchant">Merchant (Make Payment)</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted block mb-1 font-medium">Display Priority</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formPriority}
                    onChange={(e) => setFormPriority(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1 font-medium">Customer Instructions</label>
                <textarea
                  rows={2}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Send Money to our personal number using Send Money option..."
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-card-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSource(null)}
                  className="px-4 py-2 rounded-lg bg-card border border-card-border text-muted hover:text-foreground font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary text-background font-bold hover:bg-primary-hover flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save & Update Live'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full border border-card-border space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-card-border pb-3">
              <h2 className="font-bold text-base text-foreground">Add New Payment Number</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSource} className="space-y-3 text-xs">
              <div>
                <label className="text-muted block mb-1 font-medium">Source Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. bKash Personal 2"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted block mb-1 font-medium">Provider</label>
                <select
                  value={formProvider}
                  onChange={(e) => setFormProvider(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="text-muted block mb-1 font-medium">
                  Payment Account Number <span className="text-primary font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="017XXXXXXXX"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#090C12] border border-primary/40 font-mono text-foreground font-bold text-base focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted block mb-1 font-medium">Account Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="personal">Personal (Send Money)</option>
                    <option value="agent">Agent (Cash Out)</option>
                    <option value="merchant">Merchant (Make Payment)</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted block mb-1 font-medium">Priority</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formPriority}
                    onChange={(e) => setFormPriority(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1 font-medium">Instructions</label>
                <textarea
                  rows={2}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Send Money to our personal number using Send Money option..."
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-card-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-card border border-card-border text-muted hover:text-foreground font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary text-background font-bold hover:bg-primary-hover flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>{saving ? 'Creating...' : 'Add Number'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
