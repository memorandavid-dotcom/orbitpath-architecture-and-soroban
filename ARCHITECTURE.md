# OrbitPath Architecture Documentation

## System Overview

OrbitPath is an intelligent routing layer for cross-border payments on the Stellar Network. It automatically discovers the most cost-efficient asset conversion paths using on-chain liquidity and executes transfers with minimal fees.

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACES                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Web Dashboard   │  │  Mobile SDK      │                 │
│  │  (React)         │  │  (TypeScript)    │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
└───────────┼──────────────────────┼──────────────────────────┘
            │                      │
┌───────────▼──────────────────────▼──────────────────────────┐
│           ORBITPATH SDK LAYER (TypeScript)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Path Discovery Engine                              │   │
│  │  - Stellar Horizon API Integration                  │   │
│  │  - Real-time Liquidity Pool Queries                │   │
│  │  - Multi-path Evaluation Algorithm                 │   │
│  │  - Fee Calculation & Comparison                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Transaction Builder                                │   │
│  │  - PathPaymentStrictReceive Construction           │   │
│  │  - PathPaymentStrictSend Construction             │   │
│  │  - Wallet Signing Integration                      │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────┬──────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│         STELLAR JAVASCRIPT SDK (stellar-sdk)                 │
├─────────────────────────────────────────────────────────────┤
│  - Path Payment Operations                                   │
│  - Horizon API Client                                        │
│  - Transaction Submission & Signing                          │
└───────────┬──────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│      STELLAR NETWORK (Public/Testnet)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │   Soroban   │  │   Stellar    │  │   Anchors       │    │
│  │  Contracts  │  │   DEX/AMMs   │  │   (Fiat On/Off) │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Liquidity Pools (USDC, XLM, Regional Tokens)       │   │
│  │  - Path Payment Payment Paths                        │   │
│  │  - AMM Trading Pairs                                │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow: Cross-Border Payment

```
USER INITIATES PAYMENT
  │
  ├─► Input: Source Amount + Currency, Destination Currency
  │
  ▼
ORBITPATH SDK - Path Discovery
  │
  ├─► Query Horizon API for available trading pairs
  ├─► Identify all possible conversion paths
  ├─► Calculate total fees for each path
  ├─► Filter paths by liquidity depth
  │
  ▼
Build Quote Response
  │
  ├─► Best path (lowest cost)
  ├─► Alternative paths
  ├─► Fee breakdown
  ├─► Exchange rates
  ├─► Delivery time estimate
  │
  ▼
USER APPROVES TRANSACTION
  │
  ├─► Select preferred path
  ├─► Connect wallet (Albedo/Freighter)
  │
  ▼
BUILD PATH PAYMENT TRANSACTION
  │
  ├─► Source: User wallet
  ├─► Send Amount: Input amount
  ├─► Destination: Recipient wallet
  ├─► Receive Asset: Destination currency
  ├─► Receive Minimum: Output amount - 0.5% slippage
  ├─► Path: [Asset 1, Asset 2, ..., Destination]
  │
  ▼
SIGN & SUBMIT TRANSACTION
  │
  ├─► Wallet signs transaction
  ├─► Transaction submitted to Stellar network
  │
  ▼
MONITOR & CONFIRM
  │
  ├─► Track transaction status
  ├─► Confirm settlement on Horizon
  ├─► Update user with delivery confirmation
  ├─► Calculate & display savings vs traditional methods
  │
  ▼
TRANSACTION COMPLETE
```

---

## 3. Component Architecture

### Frontend Layer

```
┌─ app/layout.tsx
│  └─ Global providers (WalletContext, ThemeProvider)
│
├─ app/page.tsx (Landing page)
│
├─ app/dashboard/
│  └─ page.tsx (Main dashboard)
│
├─ components/
│  ├─ WalletConnect.tsx (Wallet connection UI)
│  ├─ PaymentForm.tsx (Payment input form)
│  ├─ PathDisplay.tsx (Selected path visualization)
│  ├─ QuoteComparison.tsx (Path options & fees)
│  ├─ TransactionMonitor.tsx (TX status tracking)
│  └─ ui/ (shadcn/ui components)
│
└─ lib/
   ├─ stellar/
   │  ├─ pathfinding.ts (Path discovery algorithm)
   │  ├─ pathPayment.ts (PathPayment operation builder)
   │  ├─ horizon.ts (Horizon API client wrapper)
   │  └─ quotes.ts (Quote calculation & caching)
   │
   ├─ wallets/
   │  ├─ albedo.ts (Albedo wallet integration)
   │  ├─ freighter.ts (Freighter wallet integration)
   │  └─ walletManager.ts (Unified wallet interface)
   │
   └─ utils/
      ├─ formatting.ts (Number/currency formatting)
      ├─ fees.ts (Fee calculation logic)
      └─ constants.ts (Network constants)
```

### Backend Layer (Optional APIs)

```
/api
├─ /quotes
│  ├─ GET /quotes - Get quote for payment route
│  └─ POST /quotes - Cache and save user quotes
│
├─ /transactions
│  ├─ GET /transactions - List user transactions
│  ├─ GET /transactions/:id - Get transaction details
│  └─ POST /transactions/monitor - Setup monitoring
│
└─ /network
   └─ GET /network/paths - Get available paths (cached)
```

---

## 4. Stellar Integration Points

### PathPaymentStrictReceive

**Used when:** Recipient must receive exact amount

```typescript
{
  destination: recipientPublicKey,
  asset: destinationAsset,           // What recipient gets
  destAmount: "100.00",              // Exact amount recipient receives
  sendAsset: sourceAsset,            // What user sends
  sendMax: "150.00",                 // Max user sends (includes slippage)
  path: [intermediateAsset1, intermediateAsset2],  // Conversion path
}
```

**Example:** Send XLM, receive exactly 100 USD

### PathPaymentStrictSend

**Used when:** User must send exact amount

```typescript
{
  destination: recipientPublicKey,
  asset: destinationAsset,
  destMin: "95.00",                 // Minimum recipient gets
  sendAsset: sourceAsset,
  sendAmount: "100.00",              // Exact amount user sends
  path: [intermediateAsset1, intermediateAsset2],
}
```

**Example:** Send exactly 100 XLM, receive USD (amount varies)

### AMM Integration

Query liquidity pools for:
- Available trading pairs
- Liquidity depth
- Current exchange rates
- Slippage estimates

```
GET /ledgers/{ledger-sequence}/effects?type=trade
GET /trades?base_asset_type=...&counter_asset_type=...
```

### Soroban Smart Contracts

Deployed contracts handle:
1. **Automated Path Evaluation**
   - Continuously scan available paths
   - Calculate cost metrics
   - Identify cost-saving windows

2. **Conditional Execution**
   - Trigger transfers when conditions met
   - Rate thresholds
   - Liquidity milestones
   - Fee optimization windows

3. **Asset Management**
   - Hold user funds temporarily
   - Manage swap execution
   - Handle edge cases & reversions

---

## 5. Fee Structure & Cost Optimization

```
Total Cost = Source Fee + Network Fees + Intermediary Spreads + Destination Fee

TRADITIONAL (SWIFT): $15-50 per transaction
ORBITPATH:
  - Stellar Network Fee: 0.00001 XLM (~$0.000003)
  - Intermediary Spread: 0.5-2% (dependent on path liquidity)
  - Anchor Fee: 0.5-1% (varies by anchor)
  - Total: ~1.0-3.5% (10-20x cheaper than SWIFT)

SAVINGS EXAMPLE:
  $1,000 transfer to Philippines
  - SWIFT: $1,000 - $25 (fees) = $975 arrives
  - OrbitPath: $1,000 - $15 (fees) = $985 arrives
  - SAVINGS: $10 (1% improvement)
  - At scale (100 transactions/month): $1,200 annual savings
```

---

## 6. Wallet Integration

### Supported Wallets

1. **Albedo** (Institutional-grade)
   - High security, multi-sig support
   - API: `albedo.io/api`

2. **Freighter** (Community favorite)
   - Easy setup, browser extension
   - Built on Stellar web auth

3. **Future:** Ledger, Trezor, WalletConnect

---

## 7. User Journey

```
1. CONNECT WALLET
   User → Click "Connect" → Select wallet type → Approve connection

2. INPUT PAYMENT DETAILS
   User → Enter source amount + destination currency → Click "Get Quote"

3. REVIEW PATHS & FEES
   System → Display top 3 paths with fees, rates, delivery time
   User → Select preferred path

4. AUTHORIZE TRANSACTION
   User → Review details → Click "Send" → Sign with wallet

5. MONITOR PROGRESS
   System → Real-time TX status updates on dashboard
   User → See confirmation + savings metrics

6. CONFIRMATION
   Recipient receives funds → User sees confirmation + history
```

---

## 8. Technical Specifications

### Network Configuration

- **Primary:** Stellar Public Network
- **Testing:** Stellar Testnet
- **Horizon API:** https://horizon.stellar.org (production)

### Asset Standards

- **Issued Assets:** Format `{code}:{issuer}`
- **Native XLM:** Special asset type
- **Stablecoin Examples:** USDC (Centre), EURD (Tempo)

### Performance Targets

- Path discovery: < 1 second
- Quote generation: < 500ms
- Transaction submission: < 2 seconds
- Settlement confirmation: 3-5 seconds (Stellar avg block time)

---

## 9. Security Considerations

1. **Wallet Security**
   - Never store private keys
   - Use wallet-signing only
   - Validate wallet signatures

2. **Transaction Validation**
   - Verify destination addresses
   - Validate amounts (prevent accidental 1000x transfers)
   - Check path legitimacy (no obvious scams)

3. **Slippage Protection**
   - Default 0.5% slippage tolerance
   - User-configurable limits
   - Real-time re-quote before TX submission

4. **Rate Limiting**
   - Horizon API calls: cache responses (5-10s)
   - Prevent quote spam
   - Monitor for abuse patterns

---

## 10. Deployment Architecture

```
v0 Production Build
  │
  ├─ Next.js frontend (Vercel)
  ├─ SDK layer (npm package)
  ├─ Backend APIs (Node.js/Vercel Functions)
  │
  └─ External Services
     ├─ Stellar Horizon API
     ├─ Soroban Contract (deployed on network)
     ├─ Wallet providers (Albedo, Freighter)
     └─ Fiat anchors (Tempo, SureRemit, etc.)
```

---

## Next Steps

1. Deploy Soroban contract to Stellar Testnet
2. Test path discovery against Testnet liquidity
3. Perform end-to-end payment flow testing
4. Iterate on UI/UX based on feedback
5. Audit smart contract security
6. Deploy to Stellar Public Network
