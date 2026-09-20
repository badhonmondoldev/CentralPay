# CentralPay MAX — Enterprise Automated MFS Payment Infrastructure

CentralPay MAX is a production-grade, multi-merchant payment orchestration and automated verification engine for personal MFS (bKash, Nagad, Rocket, Upay).

```
Customer                    CentralPay MAX Core                Android Agent (Phone)
   │                               │                                     │
   ├── (1) Browse / Checkout ─────►│                                     │
   │                               ├── (2) Smart Source Routing          │
   │                               │       (Limits & Priority)           │
   │   (3) Manual Send Money       │                                     │
   ├──────────────────────────────►│ (MFS Provider SMS)                  │
   │                               │◄────── (4) Sync Real SMS Event ─────┤
   ├── (5) Submit TrxID ──────────►│                                     │
   │                               ├── (6) Atomic State Machine          │
   │                               │       (Idempotent & Double-Spend)   │
   │◄── (7) Instant Verified ──────┤                                     │
   │                               ├── (8) Immutable Ledger              │
   │                               ├── (9) HMAC Signed Webhook ────────► Merchant Site
```

---

## 🚀 Key Architectural Features

1. **Production-Grade Admin Security & Session Management**:
   - `bcryptjs` (Cost 12) salted password hashing. Zero plaintext credentials.
   - Database-persisted session management with automatic rotation, 30-day lifetime, and remote session revocation (`Logout All Devices`).
   - Brute-force lockout: Automatic 15-minute lock after 5 consecutive failed attempts per IP / identifier.
   - HTTP Security Headers: Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options, Referrer-Policy, and nosniff.

2. **Strict Payment State Machine (`PaymentStateMachine`)**:
   - Permitted states: `CREATED`, `WAITING_PAYMENT`, `PENDING`, `SUBMITTED`, `SMS_DETECTED`, `MATCHING`, `VERIFYING`, `VERIFIED`, `PAID`, `COMPLETED`, `REVIEW_REQUIRED`, `REJECTED`, `EXPIRED`, `CANCELLED`, `REFUNDED`.
   - Immutable amounts: Payment amount cannot be modified once initialized.
   - Irreversible states: Completed payments cannot transition back to pending or waiting.
   - Automatic expiration: Payments past their expiration time (`expires_at`) cannot be paid.

3. **Database-Level Double-Spend Prevention**:
   - Unique constraints on `(provider, transaction_id)` in PostgreSQL.
   - Atomic verification prevents reusing the same TrxID across different payments or merchants.

4. **Idempotency Engine**:
   - `Idempotency-Key` header with SHA-256 payload hash caching in `idempotency_records`.
   - Identical subsequent requests return cached responses without re-creating records or triggering duplicate side-effects.

5. **Open-Redirect & URL Spoofing Protection**:
   - Strict protocol enforcement (`https:`).
   - Domain validation against merchant's registered `allowed_redirect_domains`.

6. **Smart Payment Source Routing**:
   - Evaluates `daily_limit` vs `today_received_amount` and `per_tx_limit`.
   - Automatically hides unavailable or exhausted sources from customers.

7. **Reliable Webhook Delivery & HMAC Signatures**:
   - Signed using HMAC SHA-256 with `X-CentralPay-Signature`, `X-CentralPay-Timestamp`, and `X-CentralPay-Event-Id`.
   - Exponential backoff retry engine (10s, 30s, 2m, 10m).

8. **Refunds Engine (`/api/v1/refunds`)**:
   - Full & partial refunds with reason and status tracking.
   - Reverses balance in double-entry ledger (`ledger_entries`).

9. **Health & Monitoring (`/health`, `/api/health`)**:
   - Live checks for application latency, database connectivity, and agent heartbeat.

---

## 🛠️ Monorepo Structure

```
centralpay/
├── apps/
│   └── web/                   # Next.js 14 Web Application & Core REST API
├── packages/
│   ├── types/                 # TypeScript models, enums & interfaces
│   ├── shared/                # State machine, parsers, matching & validation
│   └── sdk/                   # CentralPay SDK client for Node.js / TypeScript
├── supabase/
│   └── migrations/            # Version-controlled PostgreSQL migrations
├── .env.example               # Environment variable templates
└── README.md
```

---

## ⚙️ Environment Variables Setup

Copy `.env.example` to `apps/web/.env.local`:

```bash
# Web Application URL
NEXT_PUBLIC_APP_URL=https://centralpay-xi.vercel.app

# Live Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...

# Admin Master Credentials
ADMIN_EMAIL=admin@centralpay.internal
ADMIN_PASSWORD=YourSecurePassword123!

# Cryptography & Webhooks
CENTRALPAY_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
WEBHOOK_SIGNING_SECRET=whsec_0123456789abcdef0123456789abcdef
```

---

## 📦 Building & Testing

```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript typecheck across all workspaces
npm run typecheck

# 3. Build monorepo packages and web app
npm run build

# 4. Run automated test suite
npm run test
```

---

## 📖 Quick API Reference

### 1. Create Payment Request
```bash
curl -X POST https://centralpay-xi.vercel.app/api/v1/payment-requests \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: idemp_unique_key_123" \
  -d '{
    "amount": 500.00,
    "currency": "BDT",
    "order_id": "ORD-1001",
    "description": "Premium Membership Deposit",
    "customer_id": "user_42",
    "redirect_url": "https://yourwebsite.com/payment/success"
  }'
```

### 2. Universal Dynamic Payment Link (No Code Needed)
```text
https://centralpay-xi.vercel.app/pay/create?amount=500&order_id=ORD-1001&desc=VIP+Plan&redirect_url=https://yourwebsite.com/callback
```

### 3. Verify Payment with TrxID
```bash
curl -X POST https://centralpay-xi.vercel.app/api/v1/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "<uuid-or-reference>",
    "sender_phone": "01712345678",
    "trx_id": "ES8K21TX99",
    "provider": "bKash"
  }'
```

### 4. Process Refund
```bash
curl -X POST https://centralpay-xi.vercel.app/api/v1/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "<uuid>",
    "amount": 200.00,
    "reason": "Customer cancelled order"
  }'
```

### 5. Health Check
```bash
curl https://centralpay-xi.vercel.app/health
```

---

## 🔒 Security Notes

- Never commit production passwords or API secrets to version control.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is only used on the server side.
- Rotate credentials immediately if compromised.
