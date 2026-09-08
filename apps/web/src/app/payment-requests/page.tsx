'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Plus,
  ArrowUpRight,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Code2,
  RefreshCw,
  Globe,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

interface PaymentRequestItem {
  id: string;
  amount: number;
  currency: string;
  reference: string;
  order_id: string;
  customer_id: string;
  description: string;
  status: string;
  created_at: string;
  redirect_url?: string;
  apps?: { name: string };
}

export default function PaymentRequestsPage() {
  const [requests, setRequests] = useState<PaymentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form states
  const [amount, setAmount] = useState('500');
  const [orderId, setOrderId] = useState('');
  const [title, setTitle] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');

  // Generated Link State
  const [generatedData, setGeneratedData] = useState<{
    payment_url: string;
    universal_link: string;
    qr_url: string;
    embed_html: string;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUniversal, setCopiedUniversal] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/payment-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.payment_requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/v1/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          order_id: orderId.trim() || `ORD_${Date.now().toString().slice(-6)}`,
          description: title.trim() || `Order Payment ৳${amount}`,
          customer_id: customerPhone.trim() || 'GUEST',
          redirect_url: redirectUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedData({
          payment_url: data.payment_url,
          universal_link: data.universal_link,
          qr_url: data.qr_url,
          embed_html: data.embed_html,
        });
        loadRequests();
      } else {
        alert(data.message || 'Error generating payment link');
      }
    } catch {
      alert('Network error while generating payment link');
    } finally {
      setCreating(false);
    }
  };

  const copyText = (text: string, setFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Payment Links & Requests</h1>
          <p className="text-xs text-muted">
            Create payment links and buttons to accept bKash/Nagad payments on any of your websites.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadRequests}
            className="p-2 rounded-xl bg-card border border-card-border text-muted hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setOrderId(`ORD_${Date.now().toString().slice(-6)}`);
              setGeneratedData(null);
              setShowModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-background font-extrabold text-xs hover:bg-primary-hover transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(85,181,16,0.35)] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Generate Payment Link</span>
          </button>
        </div>
      </div>

      {/* Integration Methods Guide Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl border border-card-border space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-xs">
            <Globe className="h-4 w-4" />
            <span>1. Direct Link / Button</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Generate a link here and paste it directly on your website button, Facebook page, or Telegram bot.
          </p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-card-border space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold text-xs">
            <Code2 className="h-4 w-4" />
            <span>2. Universal Dynamic Link</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Link any cart with: <br />
            <code className="text-[10px] text-accent font-mono">/pay/create?amount=500&order_id=123</code>
          </p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-card-border space-y-2">
          <div className="flex items-center gap-2 text-foreground font-bold text-xs">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>3. Auto-Redirect & Callback</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Customer pays, phone agent auto-verifies SMS in 5s, and customer is redirected back to your website!
          </p>
        </div>
      </div>

      {/* Payment Requests Table */}
      <div className="glass-card rounded-xl p-6 space-y-4 border border-card-border">
        <div className="flex items-center justify-between pb-2 border-b border-card-border">
          <h2 className="font-bold text-sm text-foreground">Live Payment Links & Sessions</h2>
          <span className="text-xs text-muted font-mono">{requests.length} Requests</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border text-[11px] text-muted uppercase font-semibold">
                <th className="py-3 px-4">Order ID / Ref</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Payment Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border text-xs">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No payment links created yet. Click "+ Generate Payment Link" above to create your first link!
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-card-border/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      <div>{req.order_id}</div>
                      <span className="text-[10px] text-accent font-normal">{req.reference}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      <div>{req.description}</div>
                      {req.customer_id && req.customer_id !== 'GUEST' && (
                        <div className="text-[10px] text-muted">User: {req.customer_id}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-foreground text-sm">
                      ৳{Number(req.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                          req.status === 'COMPLETED'
                            ? 'bg-primary/20 text-primary border-primary/40'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted text-[11px]">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            copyText(`https://centralpay-xi.vercel.app/pay/${req.id}`, () => {});
                            alert('Payment Link copied to clipboard!');
                          }}
                          className="p-1.5 rounded-lg bg-card-border/50 hover:bg-card-border text-muted hover:text-foreground text-xs"
                          title="Copy Link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={`/pay/${req.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold flex items-center gap-1"
                        >
                          <span>Pay Page</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Payment Link Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card p-6 rounded-2xl max-w-lg w-full border border-card-border space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-card-border pb-3">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-base text-foreground">Create Payment Link for External Website</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground p-1">
                ✕
              </button>
            </div>

            {!generatedData ? (
              <form onSubmit={handleCreateLink} className="space-y-4 text-xs">
                <div>
                  <label className="text-muted block mb-1 font-medium">
                    Payment Amount (BDT / ৳) <span className="text-primary font-bold">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-bold">৳</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="500"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#090C12] border border-card-border font-mono text-foreground font-bold text-base focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted block mb-1 font-medium">Order ID / Tracking ID</label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g. ORD_1001"
                      className="w-full p-2.5 rounded-xl bg-card border border-card-border text-foreground font-mono focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-muted block mb-1 font-medium">Customer Mobile / Username (Optional)</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX"
                      className="w-full p-2.5 rounded-xl bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-muted block mb-1 font-medium">Product / Service Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 1000 Coins Pack / Premium VIP Access"
                    className="w-full p-2.5 rounded-xl bg-card border border-card-border text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted block mb-1 font-medium">
                    Redirect URL on Success (Where customer returns after paying)
                  </label>
                  <input
                    type="url"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    placeholder="https://yourwebsite.com/payment/success"
                    className="w-full p-2.5 rounded-xl bg-card border border-card-border text-foreground font-mono text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-card-border flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-card border border-card-border text-muted hover:text-foreground font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 rounded-xl bg-primary text-background font-extrabold text-xs hover:bg-primary-hover flex items-center gap-2 shadow-[0_0_15px_rgba(85,181,16,0.35)] disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>{creating ? 'Generating Link...' : 'Generate Payment Link'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary font-bold flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Payment Link Generated Successfully!</span>
                </div>

                {/* Direct Link */}
                <div className="space-y-1.5">
                  <label className="text-muted font-semibold block">1. Direct Checkout Link (Customer opens this):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedData.payment_url}
                      className="w-full p-2.5 rounded-xl bg-[#090C12] border border-card-border font-mono text-accent text-xs select-all focus:outline-none"
                    />
                    <button
                      onClick={() => copyText(generatedData.payment_url, setCopiedLink)}
                      className="px-3 py-2.5 rounded-xl bg-primary text-background font-bold shrink-0 flex items-center gap-1"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* HTML Button Embed Code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-muted font-semibold">2. Website HTML Pay Button (Paste on your site):</label>
                    <button
                      onClick={() => copyText(generatedData.embed_html, setCopiedEmbed)}
                      className="text-primary hover:underline text-[11px] font-semibold flex items-center gap-1"
                    >
                      {copiedEmbed ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedEmbed ? 'Copied HTML' : 'Copy HTML'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-[#090C12] border border-card-border font-mono text-[10px] text-muted overflow-x-auto whitespace-pre-wrap">
                    <code>{generatedData.embed_html}</code>
                  </pre>
                </div>

                {/* Universal Dynamic Link */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-muted font-semibold">3. Universal Dynamic URL (For dynamic amounts):</label>
                    <button
                      onClick={() => copyText(generatedData.universal_link, setCopiedUniversal)}
                      className="text-accent hover:underline text-[11px] font-semibold flex items-center gap-1"
                    >
                      {copiedUniversal ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedUniversal ? 'Copied URL' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={generatedData.universal_link}
                    className="w-full p-2.5 rounded-xl bg-[#090C12] border border-card-border font-mono text-muted text-[11px] select-all focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-card-border flex items-center justify-between">
                  <a
                    href={generatedData.payment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 font-bold flex items-center gap-1.5"
                  >
                    <span>Test Checkout in New Tab</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <button
                    onClick={() => {
                      setGeneratedData(null);
                      setAmount('500');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-card border border-card-border text-foreground hover:bg-card-border font-medium"
                  >
                    Create Another Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
