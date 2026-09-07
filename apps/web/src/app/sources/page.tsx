'use client';

import React, { useState, useEffect } from 'react';
import { Radio, Plus, Edit2, Save, Check, Smartphone, Trash2, Power, AlertCircle } from 'lucide-react';

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
  const [sources, setSources] = useState<PaymentSourceItem[]>([
    {
      id: 'src_bkash_01',
      name: 'bKash Personal Account',
      provider_label: 'bKash',
      account_number: '01700000000',
      account_type: 'personal',
      currency: 'BDT',
      priority: 1,
      is_active: true,
      instructions: 'Send Money to our bKash personal number with the reference code.',
    },
    {
      id: 'src_nagad_01',
      name: 'Nagad Personal Account',
      provider_label: 'Nagad',
      account_number: '01800000000',
      account_type: 'personal',
      currency: 'BDT',
      priority: 2,
      is_active: true,
      instructions: 'Send Money to our Nagad personal number with the reference code.',
    },
  ]);

  const [editingSource, setEditingSource] = useState<PaymentSourceItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for Add / Edit
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Custom'>('bKash');
  const [formNumber, setFormNumber] = useState('');
  const [formType, setFormType] = useState<'personal' | 'agent' | 'merchant'>('personal');
  const [formPriority, setFormPriority] = useState(1);
  const [formInstructions, setFormInstructions] = useState('');

  const openEditModal = (src: PaymentSourceItem) => {
    setEditingSource(src);
    setFormName(src.name);
    setFormProvider(src.provider_label);
    setFormNumber(src.account_number);
    setFormType(src.account_type);
    setFormPriority(src.priority);
    setFormInstructions(src.instructions || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource || !formNumber) return;

    const updated = sources.map((s) =>
      s.id === editingSource.id
        ? {
            ...s,
            name: formName,
            provider_label: formProvider,
            account_number: formNumber,
            account_type: formType,
            priority: formPriority,
            instructions: formInstructions,
          }
        : s
    );

    setSources(updated);
    setEditingSource(null);
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNumber) return;

    const newSrc: PaymentSourceItem = {
      id: `src_${Date.now()}`,
      name: formName || `${formProvider} Account`,
      provider_label: formProvider,
      account_number: formNumber,
      account_type: formType,
      currency: 'BDT',
      priority: formPriority,
      is_active: true,
      instructions: formInstructions || `Send Money using ${formProvider}`,
    };

    setSources([...sources, newSrc]);
    setShowAddModal(false);
    setFormName('');
    setFormNumber('');
  };

  const toggleSourceActive = (id: string) => {
    setSources(sources.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Payment Sources & Account Numbers</h1>
          <p className="text-xs text-muted">Configure and edit personal payment numbers (bKash, Nagad, Rocket, Custom).</p>
        </div>
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
          <span>Add Payment Source</span>
        </button>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => (
          <div key={src.id} className="glass-card-interactive p-5 rounded-xl space-y-4 flex flex-col justify-between">
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
                    onClick={() => toggleSourceActive(src.id)}
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
                  <span className="text-[10px] text-muted block uppercase">Configured Number</span>
                  <span className="font-mono font-extrabold text-foreground text-base">{src.account_number}</span>
                </div>
                <span className="text-xs text-muted font-sans font-semibold">Priority #{src.priority}</span>
              </div>

              {src.instructions && <p className="text-[11px] text-muted italic leading-relaxed">"{src.instructions}"</p>}
            </div>

            <div className="pt-3 border-t border-card-border flex items-center justify-between text-xs">
              <span className="text-[10px] text-muted">Currency: {src.currency}</span>
              <button
                onClick={() => openEditModal(src)}
                className="px-3 py-1.5 rounded-lg bg-card-border hover:bg-primary/20 text-muted hover:text-primary transition-colors flex items-center gap-1.5 font-semibold text-xs"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Number</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Payment Source Modal */}
      {editingSource && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full border border-card-border space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-card-border pb-3">
              <h2 className="font-bold text-base text-foreground">Edit Payment Number / Source</h2>
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
                <label className="text-muted block mb-1 font-medium">Payment Account Number (e.g. 017XXXXXXXX)</label>
                <input
                  type="text"
                  required
                  placeholder="017XXXXXXXX"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border font-mono text-foreground font-bold text-sm focus:border-primary focus:outline-none"
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
                    <option value="personal">Personal</option>
                    <option value="agent">Agent</option>
                    <option value="merchant">Merchant</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted block mb-1 font-medium">Priority Order</label>
                  <input
                    type="number"
                    value={formPriority}
                    onChange={(e) => setFormPriority(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1 font-medium">Payment Instructions</label>
                <textarea
                  rows={2}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Send Money to our personal number..."
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingSource(null)}
                  className="px-4 py-2 rounded-xl bg-card border border-card-border text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-background font-bold hover:bg-primary-hover flex items-center gap-1.5">
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full border border-card-border space-y-4 shadow-2xl">
            <h2 className="font-bold text-base text-foreground border-b border-card-border pb-3">Add New Payment Source</h2>

            <form onSubmit={handleAddSource} className="space-y-3 text-xs">
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
                <label className="text-muted block mb-1 font-medium">Payment Account Number</label>
                <input
                  type="text"
                  required
                  placeholder="017XXXXXXXX"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-card border border-card-border font-mono text-foreground font-bold text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted block mb-1 font-medium">Source Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. bKash Personal 017"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
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
                <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-background font-bold hover:bg-primary-hover">
                  Add Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
