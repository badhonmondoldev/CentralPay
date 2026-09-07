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
  ArrowRight,
  ArrowLeft,
  Lock,
  ExternalLink,
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
  redirect_url?: string;
  paymentSources: Array<{
    id: string;
    provider: string;
    accountNumber: string;
    instructions: string;
  }>;
}

export default function CommercialHostedCheckoutPage() {
  const params = useParams();
  const paymentId = params.paymentId as string;

  const [checkoutData, setCheckoutData] = useState<PaymentCheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Step State: 1 = Sender Phone, 2 = Select Provider & Instructions, 3 = Submit TrxID, 4 = Verifying / Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // User Inputs
  const [senderPhone, setSenderPhone] = useState('');
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [trxId, setTrxId] = useState('');

  // UI state
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(1800);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);

  useEffect(() => {
    async function loadPayment() {
      try {
        const res = await fetch(`/api/v1/payments/${paymentId}`);
        if (res.ok) {
          const data = await res.json();
          setCheckoutData(data.checkout);
          if (data.checkout.status === 'COMPLETED') {
            setStep(4);
          }
        } else {
          // Default development simulation data
          setCheckoutData({
            id: paymentId,
            reference: 'ES8K21',
            amount: 500,
            currency: 'BDT',
            description: 'Wallet Deposit - Order #1001',
            appName: 'EarnSpace',
            status: 'WAITING_PAYMENT',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            redirect_url: 'https://earnspace.com/payment/success',
            paymentSources: [
              {
                id: 'src_bkash',
                provider: 'bKash Personal',
                accountNumber: '01700000000',
                instructions: 'Send Money to our bKash personal number using Send Money option.',
              },
              {
                id: 'src_nagad',
                provider: 'Nagad Personal',
                accountNumber: '01800000000',
                instructions: 'Send Money to our Nagad personal number using Send Money option.',
              },
            ],
          });
        }
      } catch {
        setCheckoutData({
          id: paymentId,
          reference: 'ES8K21',
          amount: 500,
          currency: 'BDT',
          description: 'Wallet Deposit - Order #1001',
          appName: 'EarnSpace',
          status: 'WAITING_PAYMENT',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          redirect_url: 'https://earnspace.com/payment/success',
          paymentSources: [
            {
              id: 'src_bkash',
              provider: 'bKash Personal',
              accountNumber: '01700000000',
              instructions: 'Send Money to our bKash personal number using Send Money option.',
            },
            {
              id: 'src_nagad',
              provider: 'Nagad Personal',
              accountNumber: '01800000000',
              instructions: 'Send Money to our Nagad personal number using Send Money option.',
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    }

    loadPayment();
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

  // Redirect countdown on Step 4 (Success)
  useEffect(() => {
    if (step === 4 && checkoutData?.status === 'COMPLETED') {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            if (checkoutData.redirect_url) {
              window.location.href = checkoutData.redirect_url;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, checkoutData]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone || senderPhone.length < 11) {
      setVerifyError('Please enter a valid 11-digit mobile number (e.g. 017XXXXXXXX)');
      return;
    }
    setVerifyError(null);
    setStep(2);
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId || trxId.length < 6) {
      setVerifyError('Please enter a valid Transaction ID (TrxID)');
      return;
    }

    setVerifyError(null);
    setIsVerifying(true);

    try {
      // Call Real Verification API Endpoint
      const response = await fetch('/api/v1/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          sender_phone: senderPhone,
          trx_id: trxId,
          provider: checkoutData?.paymentSources[selectedSourceIndex]?.provider || 'bKash',
        }),
      });

      const resData = await response.json();

      if (resData.success && resData.matched) {
        if (checkoutData) {
          setCheckoutData({ ...checkoutData, status: 'COMPLETED' });
        }
        setStep(4);
      } else {
        setVerifyError(
          resData.message ||
            `Verification failed: No matching SMS found for TrxID '${trxId}'. Please make sure you sent money and entered the exact TrxID.`
        );
      }
    } catch {
      setVerifyError('Network error while verifying payment. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading || !checkoutData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 text-primary animate-pulse">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="font-semibold text-lg">Loading Commercial Gateway...</span>
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
          <span className="font-bold text-sm text-foreground tracking-tight">CENTRALPAY GATEWAY</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
          <Lock className="h-3.5 w-3.5 text-primary" />
          <span>256-BIT SSL ENCRYPTED</span>
        </div>
      </div>

      {/* Main Gateway Card */}
      <div className="w-full max-w-md glass-card rounded-2xl p-6 border border-card-border space-y-6 shadow-2xl relative overflow-hidden">
        {/* App Info & Amount Header */}
        <div className="text-center border-b border-card-border pb-4 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-card-border text-xs text-muted font-medium">
            <span>{checkoutData.appName}</span>
          </div>
          <p className="text-xs text-muted">{checkoutData.description}</p>
          <div className="text-3xl font-extrabold text-foreground tracking-tight pt-1">
            ৳{checkoutData.amount.toLocaleString()}{' '}
            <span className="text-xs font-normal text-muted">{checkoutData.currency}</span>
          </div>
        </div>

        {/* Progress Step Indicator Bar */}
        <div className="flex items-center justify-between px-2 text-xs">
          <div className={`flex items-center gap-1.5 font-semibold ${step >= 1 ? 'text-primary' : 'text-muted'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 1 ? 'bg-primary text-background' : 'bg-card-border text-muted'}`}>1</span>
            <span>Sender</span>
          </div>
          <div className="h-0.5 w-6 bg-card-border" />
          <div className={`flex items-center gap-1.5 font-semibold ${step >= 2 ? 'text-primary' : 'text-muted'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 2 ? 'bg-primary text-background' : 'bg-card-border text-muted'}`}>2</span>
            <span>Send Money</span>
          </div>
          <div className="h-0.5 w-6 bg-card-border" />
          <div className={`flex items-center gap-1.5 font-semibold ${step >= 3 ? 'text-primary' : 'text-muted'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 3 ? 'bg-primary text-background' : 'bg-card-border text-muted'}`}>3</span>
            <span>TrxID</span>
          </div>
        </div>

        {/* Expiration Timer Bar */}
        {step < 4 && (
          <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-card border border-card-border text-xs">
            <div className="flex items-center gap-2 text-muted">
              <Clock className="h-3.5 w-3.5 text-accent" />
              <span>Session Expires In:</span>
            </div>
            <span className="font-mono font-bold text-accent">{formatTimer(timeLeft)}</span>
          </div>
        )}

        {verifyError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{verifyError}</span>
          </div>
        )}

        {/* STEP 1: Enter Customer's Sender Phone Number */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                আপনার মোবাইল নম্বর দিন (Sender Phone Number)
              </label>
              <p className="text-[11px] text-muted leading-relaxed">
                যে বিকাশ/নগদ/রকেট নম্বর থেকে টাকা পাঠাবেন, সেই নম্বরটি লিখুন। কোনো রেফারেল বা রেফারেন্স কোড লাগবে না।
              </p>
              <input
                type="tel"
                required
                placeholder="e.g. 01712345678"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#090C12] border border-card-border font-mono text-base font-bold text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-primary text-background font-extrabold text-xs hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(85,181,16,0.3)]"
            >
              <span>পেমেন্ট নম্বরসমূহ দেখুন</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Select Provider & View Send Money Account Number */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-muted hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>ফিরে যান</span>
              </button>
              <span className="text-xs text-muted">
                Sender: <strong className="text-foreground font-mono">{senderPhone}</strong>
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                পেমেন্ট মেথড সিলেক্ট করুন (Payment Method)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {checkoutData.paymentSources.map((source, idx) => (
                  <button
                    key={source.id}
                    type="button"
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
            </div>

            {/* Payment Details Box */}
            <div className="bg-[#090C12] rounded-xl p-4 border border-card-border space-y-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>টাকা পাঠানোর নম্বর ({currentSource.provider}):</span>
                <span className="text-[10px] text-primary font-medium">Personal (Send Money)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-card-border font-mono text-base font-bold text-foreground">
                <span>{currentSource.accountNumber}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(currentSource.accountNumber)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-sans font-semibold bg-primary/10 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copiedNumber ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-3.5 rounded-xl bg-card border border-card-border text-xs text-muted space-y-1.5">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span>কীভাবে টাকা পাঠাবেন?</span>
              </div>
              <ol className="list-decimal list-inside text-[11px] text-muted space-y-1">
                <li>আপনার <strong className="text-foreground">{senderPhone}</strong> নম্বর থেকে {currentSource.provider} অ্যাপ খুলুন।</li>
                <li><strong className="text-foreground">Send Money</strong> অপশন সিলেক্ট করে <strong className="text-foreground">{currentSource.accountNumber}</strong> নম্বরে টাকা পাঠান।</li>
                <li>ঠিক <strong className="text-foreground">৳{checkoutData.amount}</strong> টাকা Send Money করুন।</li>
                <li>টাকা পাঠানো শেষ হলে এসএমএস-এ পাওয়া <strong className="text-accent">Transaction ID (TrxID)</strong> সাবমিট করুন।</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full py-3 rounded-xl bg-primary text-background font-extrabold text-xs hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(85,181,16,0.3)]"
            >
              <span>টাকা পাঠিয়েছি - TrxID সাবমিট করুন</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP 3: Enter & Submit Transaction ID (TrxID) */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-muted hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>নম্বরে ফিরে যান</span>
              </button>
              <span className="text-xs text-muted">
                Sender: <strong className="text-foreground font-mono">{senderPhone}</strong>
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Transaction ID (TrxID) দিন
              </label>
              <p className="text-[11px] text-muted leading-relaxed">
                টাকা পাঠানোর পর আপনার ফোনে পাওয়া SMS থেকে TrxID টি কপি করে নিচে পেস্ট করুন।
              </p>
              <input
                type="text"
                required
                placeholder="e.g. 8K21TX99"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                className="w-full p-3 rounded-xl bg-[#090C12] border border-card-border font-mono text-base font-bold text-accent placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-xl bg-accent text-background font-extrabold text-xs hover:bg-accent-hover transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,217,255,0.3)] disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>অটো ভেরিফাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>ভেরিফাই করুন & পেমেন্ট সম্পন্ন করুন</span>
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Success & Live Auto-Redirect */}
        {step === 4 && (
          <div className="text-center py-4 space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 border-2 border-primary text-primary flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(85,181,16,0.4)]">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">পেমেন্ট সফলভাবে ভেরিফাইড!</h2>
              <p className="text-xs text-muted mt-1">
                আপনার ৳{checkoutData.amount} টাকা সফলভাবে রিসিভ এবং ভেরিফাই করা হয়েছে।
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090C12] border border-card-border space-y-1.5 font-mono text-xs text-left">
              <div className="flex justify-between text-muted">
                <span>Application:</span>
                <span className="text-foreground font-sans font-semibold">{checkoutData.appName}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Sender Phone:</span>
                <span className="text-foreground">{senderPhone || '01712345678'}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>TrxID:</span>
                <span className="text-accent font-bold">{trxId || checkoutData.reference}</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-muted">
              <p>
                স্বয়ংক্রিয়ভাবে মূল ওয়েবসাইটে রিডাইরেক্ট হচ্ছে (<strong className="text-accent">{redirectCountdown}s</strong>)...
              </p>
              {checkoutData.redirect_url && (
                <a
                  href={checkoutData.redirect_url}
                  className="mt-3 inline-flex items-center gap-1.5 text-primary hover:underline font-semibold text-xs"
                >
                  <span>এখনই ওয়েবসাইটে ফিরে যান</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
