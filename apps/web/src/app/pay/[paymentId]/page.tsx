'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface PaymentCheckoutData {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  description: string;
  appName: string;
  appLogo?: string;
  status: string;
  expiresAt: string;
  paymentSources: Array<{
    id: string;
    provider: string;
    accountNumber: string;
    instructions: string;
  }>;
}

export default function HostedCheckoutPage() {
  const params = useParams();
  const paymentId = params.paymentId as string;

  const [checkoutData, setCheckoutData] = useState<PaymentCheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 minutes in seconds

  useEffect(() => {
    // Fetch payment status
    async function loadPayment() {
      try {
        const res = await fetch(`/api/v1/payments/${paymentId}`);
        if (res.ok) {
          const data = await res.json();
          setCheckoutData(data.checkout);
        } else {
          // Fallback mock checkout data for development simulation
          setCheckoutData({
            id: paymentId,
            reference: 'ES8K21',
            amount: 500,
            currency: 'BDT',
            description: 'Wallet Deposit - Order #1001',
            appName: 'EarnSpace',
            status: 'WAITING_PAYMENT',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            paymentSources: [
              {
                id: 'src_bkash',
                provider: 'bKash Personal',
                accountNumber: '01700000000',
                instructions: 'Use Send Money option in bKash app. Enter the payment reference in the reference box.',
              },
              {
                id: 'src_nagad',
                provider: 'Nagad Personal',
                accountNumber: '01800000000',
                instructions: 'Use Send Money option in Nagad app. Include reference code in notes if allowed.',
              },
            ],
          });
        }
      } catch {
        // Fallback demo data
        setCheckoutData({
          id: paymentId,
          reference: 'ES8K21',
          amount: 500,
          currency: 'BDT',
          description: 'Wallet Deposit - Order #1001',
          appName: 'EarnSpace',
          status: 'WAITING_PAYMENT',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          paymentSources: [
            {
              id: 'src_bkash',
              provider: 'bKash Personal',
              accountNumber: '01700000000',
              instructions: 'Use Send Money option in bKash app. Enter the payment reference in the reference box.',
            },
            {
              id: 'src_nagad',
              provider: 'Nagad Personal',
              accountNumber: '01800000000',
              instructions: 'Use Send Money option in Nagad app. Include reference code in notes if allowed.',
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    }

    loadPayment();

    // Poll status every 5 seconds
    const interval = setInterval(loadPayment, 5000);
    return () => clearInterval(interval);
  }, [paymentId]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, type: 'number' | 'ref') => {
    navigator.clipboard.writeText(text);
    if (type === 'number') {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  if (loading || !checkoutData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 text-primary animate-pulse">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="font-semibold text-lg">Loading Checkout...</span>
        </div>
      </div>
    );
  }

  const currentSource = checkoutData.paymentSources[selectedSourceIndex] || checkoutData.paymentSources[0];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-8">
      {/* Brand Header */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
            <Zap className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm text-foreground tracking-tight">CENTRALPAY</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Direct SMS Verification</span>
        </div>
      </div>

      {/* Main Checkout Card */}
      <div className="w-full max-w-md glass-card rounded-2xl p-6 border border-card-border space-y-6 shadow-2xl">
        {/* App Info & Amount */}
        <div className="text-center border-b border-card-border pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card-border text-xs text-muted mb-3 font-medium">
            <span>{checkoutData.appName}</span>
          </div>
          <p className="text-xs text-muted mb-1">{checkoutData.description}</p>
          <div className="text-4xl font-extrabold text-foreground tracking-tight">
            ৳{checkoutData.amount.toLocaleString()} <span className="text-sm font-normal text-muted">{checkoutData.currency}</span>
          </div>
        </div>

        {/* Expiration Countdown Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-card border border-card-border text-xs">
          <div className="flex items-center gap-2 text-muted">
            <Clock className="h-4 w-4 text-accent" />
            <span>Time Remaining:</span>
          </div>
          <span className="font-mono font-bold text-accent text-sm">{formatTimer(timeLeft)}</span>
        </div>

        {/* Status Badge Indicator */}
        <div className="flex items-center justify-center">
          {checkoutData.status === 'COMPLETED' ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40 text-primary font-semibold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              <span>Payment Completed</span>
            </div>
          ) : checkoutData.status === 'SMS_DETECTED' || checkoutData.status === 'VERIFYING' ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/40 text-accent font-semibold text-sm animate-pulse">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>SMS Detected! Verifying Payment...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-card-border text-muted font-medium text-xs">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              <span>Waiting for SMS Confirmation</span>
            </div>
          )}
        </div>

        {/* Payment Source Selection Tabs */}
        {checkoutData.status !== 'COMPLETED' && (
          <div className="space-y-4">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
              Select Payment Source
            </label>
            <div className="grid grid-cols-2 gap-2">
              {checkoutData.paymentSources.map((source, idx) => (
                <button
                  key={source.id}
                  onClick={() => setSelectedSourceIndex(idx)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    selectedSourceIndex === idx
                      ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(85,181,16,0.2)]'
                      : 'bg-card border-card-border text-muted hover:text-foreground'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  {source.provider}
                </button>
              ))}
            </div>

            {/* Payment Details Box */}
            <div className="bg-[#090C12] rounded-xl p-4 border border-card-border space-y-4">
              {/* Account Number Box */}
              <div>
                <div className="flex items-center justify-between text-xs text-muted mb-1">
                  <span>Send Money To Number:</span>
                  <span className="text-[10px] text-primary font-medium">Personal Account</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-card-border font-mono text-base font-bold text-foreground">
                  <span>{currentSource.accountNumber}</span>
                  <button
                    onClick={() => copyToClipboard(currentSource.accountNumber, 'number')}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-sans font-semibold bg-primary/10 px-2.5 py-1 rounded-md transition-colors"
                  >
                    {copiedNumber ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Payment Reference Box */}
              <div>
                <div className="flex items-center justify-between text-xs text-muted mb-1">
                  <span>Payment Reference Code:</span>
                  <span className="text-[10px] text-accent font-medium">Required Note</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-card-border font-mono text-base font-bold text-accent">
                  <span>{checkoutData.reference}</span>
                  <button
                    onClick={() => copyToClipboard(checkoutData.reference, 'ref')}
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-sans font-semibold bg-accent/10 px-2.5 py-1 rounded-md transition-colors"
                  >
                    {copiedRef ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedRef ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions Alert Box */}
            <div className="p-3.5 rounded-xl bg-card border border-card-border text-xs text-muted space-y-1.5">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span>Instructions</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Send exactly <strong className="text-foreground">৳{checkoutData.amount}</strong> to{' '}
                <strong className="text-foreground">{currentSource.accountNumber}</strong> using {currentSource.provider}.
                Include reference <strong className="text-accent">{checkoutData.reference}</strong> in the note/reference field.
              </p>
              <p className="text-[10px] text-primary pt-1">
                ✓ Your payment will be detected automatically when the confirmation SMS is received.
              </p>
            </div>
          </div>
        )}

        {/* Action / Help Footer */}
        <div className="pt-2 text-center text-xs text-muted">
          <p>Need help? Contact {checkoutData.appName} support.</p>
        </div>
      </div>
    </div>
  );
}
