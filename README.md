# OrbitPath - Intelligent Cross-Border Payments on Stellar

A production-ready full-stack application demonstrating intelligent payment routing on the Stellar Network. OrbitPath automatically discovers optimal asset conversion paths using on-chain liquidity pools, minimizing fees and maximizing efficiency for cross-border transfers.

**Hackathon Track:** DeFi & Ecosystem Composability

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Getting Started](#getting-started)
6. [Frontend Implementation](#frontend-implementation)
7. [Backend/Smart Contracts](#backendsmart-contracts)
8. [SDK Integration](#sdk-integration)
9. [Deployment](#deployment)
10. [Next Steps](#next-steps)

---

## Project Overview

### Problem
Cross-border payments suffer from:
- **Fragmented liquidity** across multiple intermediaries
- **High fees** (3-10% typical via SWIFT/correspondent banking)
- **Slow settlement** (2-5 business days)
- **Lack of transparency** in FX rates and conversion paths

### Solution
OrbitPath is an intelligent routing layer that:
- **Scans on-chain liquidity pools** in real-time
- **Calculates optimal conversion paths** using Stellar PathPayment operations
- **Executes transfers automatically** via Soroban smart contracts
- **Saves 60-80%** compared to traditional banking

### Target Users
1. **Migrant Workers** - Monthly remittances with zero tolerance for high fees
2. **SMEs** - International vendor payments without SWIFT delays
3. **DeFi Traders** - Arbitrage opportunities between liquidity pools

---

## Architecture

### System Layers

```
┌─────────────────────────────────┐
│     React Web Dashboard         │ ← User Interface
├─────────────────────────────────┤
│   Stellar SDK Integration       │ ← Pathfinding & Quotes
├─────────────────────────────────┤
│  Wallet Management Layer        │ ← Freighter, Albedo
├─────────────────────────────────┤
│  Stellar Network & Soroban      │ ← On-chain execution
└─────────────────────────────────┘
```

### Key Components

**Frontend:**
- `app/page.tsx` - Main dashboard and payment interface
- `components/PaymentForm.tsx` - Payment input and asset selection
- `components/QuoteDisplay.tsx` - Path options and fee comparison
- `components/WalletConnect.tsx` - Multi-wallet support
- `components/TransactionMonitor.tsx` - TX history and tracking

**SDK Layer:**
- `lib/stellar/pathfinding.ts` - Path discovery and quote calculation
- `lib/stellar/pathPayment.ts` - PathPayment transaction builder
- `lib/wallets/walletManager.ts` - Unified wallet interface

**Smart Contracts:**
- `soroban/src/lib.rs` - Rust-based Soroban contract for automated routing
- `soroban/Cargo.toml` - Contract dependencies

---

## Features

### Current Implementation

✓ **Real-time Path Discovery**
- Queries Stellar Horizon API for available trading pairs
- Evaluates multiple conversion paths
- Ranks by fee efficiency and liquidity depth

✓ **Multi-Wallet Support**
- Freighter (browser extension)
- Albedo (web-based signing)
- Custom/manual wallet entry

✓ **Fee Comparison**
- Shows up to 5 alternative paths
- Displays fee breakdown per hop
- Highlights cost savings vs traditional methods

✓ **Transaction History**
- Tracks completed payments
- Shows execution time and actual fees
- Links to Horizon for verification

✓ **Responsive Design**
- Mobile-optimized interface
- Dark/light theme support
- Modern Tailwind CSS styling

### Future Enhancements

- [ ] Automated trigger conditions (Soroban contracts)
- [ ] Anchor integration for fiat on/off-ramps
- [ ] Advanced fee optimization algorithms
- [ ] Historical analytics dashboard
- [ ] API for programmatic access
- [ ] Multi-signature wallet support
- [ ] Real-time notifications

---

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library with latest hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library

### Backend/Blockchain
- **@stellar/stellar-sdk** - Stellar JavaScript SDK
- **Soroban (Rust)** - Smart contracts for automation
- **Stellar Horizon API** - RESTful API for chain data

### State Management
- **Zustand** - Lightweight state management
- **SWR** - Data fetching and caching
- **React Hooks** - Local component state

### Development
- **pnpm** - Fast package manager
- **ESLint** - Code quality
- **TypeScript** - Type safety

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Stellar wallet (Freighter or Albedo)
- Testnet XLM (from friendbot)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd orbitpath

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Visit `http://localhost:3000` in your browser.

### Environment Variables

```env
# .env.local (optional, for production)
NEXT_PUBLIC_STELLAR_NETWORK=testnet
```

---

## Frontend Implementation

### Payment Form Component

```typescript
// components/PaymentForm.tsx
const PaymentForm = ({ onQuoteReceived }) => {
  const [sourceAsset, setSourceAsset] = useState('XLM');
  const [destinationAsset, setDestinationAsset] = useState('USDC');
  const [sourceAmount, setSourceAmount] = useState('100');

  const handleGetQuote = async () => {
    const pathFinder = new PathFinder('testnet');
    const quote = await pathFinder.findOptimalPath(
      sourceAsset,
      destinationAsset,
      sourceAmount
    );
    onQuoteReceived(quote);
  };

  return (
    <div>
      {/* Input fields */}
      <Input value={sourceAmount} onChange={...} />
      <Select value={sourceAsset} onChange={...} />
      <Button onClick={handleGetQuote}>Get Best Rate</Button>
    </div>
  );
};
```

### Quote Display Component

```typescript
// components/QuoteDisplay.tsx
const QuoteDisplay = ({ quote, onPathSelected }) => {
  return (
    <div>
      {quote.alternativePaths.map((path, idx) => (
        <PathCard
          key={idx}
          path={path}
          onSelect={() => onPathSelected(path)}
        />
      ))}
    </div>
  );
};
```

### Wallet Integration

```typescript
// components/WalletConnect.tsx
const WalletConnect = ({ onConnected }) => {
  const handleConnect = async (walletType) => {
    const manager = getWalletManager();
    const connection = await manager.connect(walletType);
    onConnected(connection);
  };

  return (
    <button onClick={() => handleConnect('freighter')}>
      Connect Freighter
    </button>
  );
};
```

---

## Backend/Smart Contracts

### Soroban Contract Structure

The `soroban/src/lib.rs` contract provides:

**1. Path Evaluation**
```rust
pub fn evaluate_path(
  env: Env,
  source_asset: Asset,
  destination_asset: Asset,
  send_amount: i128,
  path_assets: Vec<Asset>,
) -> ConversionPath
```

**2. Optimal Path Selection**
```rust
pub fn select_optimal_path(
  env: Env,
  paths: Vec<ConversionPath>,
  min_liquidity_requirement: i128,
) -> (u32, ConversionPath)
```

**3. Automated Execution**
```rust
pub fn execute_payment(
  env: Env,
  route_id: Symbol,
  current_rate: i128,
  current_liquidity: i128,
) -> String
```

### Building & Deploying

```bash
cd soroban/

# Build contract
soroban contract build --profile release

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/orbitpath_contract.wasm \
  --source mykey \
  --network testnet
```

See `soroban/DEPLOYMENT.md` for full instructions.

---

## SDK Integration

### PathFinder Usage

```typescript
import { PathFinder } from '@/lib/stellar/pathfinding';

const pathFinder = new PathFinder('testnet');

// Find optimal paths
const quote = await pathFinder.findOptimalPath(
  { code: 'XLM', issuer: 'native' },
  { code: 'USDC', issuer: 'GBBD47UZE5D3V7H23C7FC7UD3UGC3QMQQ5FLHWBQKOXR7PQBHZGVVKQF' },
  '100',
  { maxPaths: 5 }
);

console.log(quote.optimalPath);
console.log(quote.alternativePaths);
```

### PathPayment Builder

```typescript
import { PathPaymentBuilder } from '@/lib/stellar/pathPayment';

const builder = new PathPaymentBuilder('testnet');

// Build PathPaymentStrictReceive
const tx = await builder.buildPathPaymentStrictReceive({
  source: senderPublicKey,
  destination: recipientPublicKey,
  destinationAsset: { code: 'USDC', issuer: '...' },
  destinationAmount: '100.00',
  sendAsset: { code: 'XLM', issuer: 'native' },
  sendMaxAmount: '150.00',
  path: [intermediateAsset1, intermediateAsset2],
});

// Sign with wallet
const signed = await walletManager.signTransaction(tx);

// Submit to network
const result = await builder.submitTransaction(signed);
console.log('TX Hash:', result.hash);
```

### Wallet Manager

```typescript
import { getWalletManager } from '@/lib/wallets/walletManager';

const manager = getWalletManager();

// Connect
const connection = await manager.connect('freighter');

// Sign transaction
const signed = await manager.signTransaction(tx);

// Get public key
const pubKey = await manager.getPublicKey();
```

---

## Deployment

### Frontend Deployment (Vercel)

```bash
# Build and deploy
pnpm build

# Deploy to Vercel
vercel deploy
```

### Smart Contract Deployment (Stellar Public Network)

```bash
# Testnet first
soroban contract deploy \
  --wasm soroban/target/wasm32-unknown-unknown/release/orbitpath_contract.wasm \
  --source mykey \
  --network testnet

# Then mainnet (after security audit)
soroban contract deploy \
  --wasm soroban/target/wasm32-unknown-unknown/release/orbitpath_contract.wasm \
  --source mainnet-key \
  --network public
```

---

## Project Structure

```
orbitpath/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Dashboard
│   ├── globals.css             # Theme & styles
│   └── favicon.ico
├── components/
│   ├── PaymentForm.tsx         # Payment input
│   ├── QuoteDisplay.tsx        # Path options
│   ├── WalletConnect.tsx       # Wallet integration
│   ├── TransactionMonitor.tsx  # TX history
│   └── ui/                     # shadcn components
├── lib/
│   ├── stellar/
│   │   ├── pathfinding.ts      # Path discovery
│   │   ├── pathPayment.ts      # TX builder
│   │   └── horizon.ts          # API wrapper
│   ├── wallets/
│   │   ├── walletManager.ts    # Wallet interface
│   │   ├── freighter.ts        # Freighter adapter
│   │   └── albedo.ts           # Albedo adapter
│   └── utils/
│       ├── formatting.ts
│       └── constants.ts
├── soroban/
│   ├── src/
│   │   └── lib.rs             # Smart contract
│   ├── Cargo.toml
│   └── DEPLOYMENT.md
├── ARCHITECTURE.md            # System design
├── README.md                  # This file
└── package.json
```

---

## API Specifications

### PathFinder Class

```typescript
class PathFinder {
  // Find optimal conversion paths
  findOptimalPath(
    source: ConversionAsset,
    destination: ConversionAsset,
    sourceAmount: string,
    options?: PathFindingOptions
  ): Promise<PaymentQuote>

  // Get available trading pairs
  getTradingPairs(asset: ConversionAsset): Promise<ConversionAsset[]>

  // Get liquidity metrics
  getLiquidityMetrics(
    base: ConversionAsset,
    counter: ConversionAsset
  ): Promise<LiquidityMetrics>

  // Clear cache
  clearCache(): void
}
```

### WalletManager Class

```typescript
class WalletManager {
  // Get available wallets
  getAvailableWallets(): WalletType[]

  // Connect to wallet
  connect(walletType: WalletType): Promise<WalletConnection>

  // Disconnect
  disconnect(): Promise<void>

  // Sign transaction
  signTransaction(transaction: Transaction): Promise<SigningResult>

  // Is connected
  isConnected(): boolean
}
```

---

## Security Considerations

### Smart Contracts
- **Audit Required** before mainnet deployment
- Validate all inputs
- Use safe math operations
- Implement reentrancy guards

### Frontend
- Never store private keys
- Use wallet signing only
- Validate recipient addresses
- Implement slippage protection (default 0.5%)

### Network
- Use Stellar Testnet for development
- Rate limit API calls (cache 5-10s)
- Monitor for abuse patterns
- Validate path legitimacy

---

## Performance Metrics

- **Path discovery:** < 1 second
- **Quote generation:** < 500ms
- **Transaction submission:** < 2 seconds
- **Settlement confirmation:** 3-5 seconds (Stellar block time)

### Optimization Tips
- Cache path queries (5-10s TTL)
- Batch multiple operations
- Use CDN for static assets
- Implement request deduplication

---

## Troubleshooting

### Quote not loading
```typescript
// Check Horizon connectivity
const server = new Server('https://horizon-testnet.stellar.org');
await server.root(); // Should return root resource
```

### Wallet connection issues
- Freighter: Refresh browser, ensure extension is enabled
- Albedo: Use HTTPS (not http://localhost for production)
- Check browser console for specific errors

### Transaction submission errors
```
// Insufficient balance
// Invalid destination address
// Path not found (no liquidity)
// Network timeout
```

---

## Contributing

This is a hackathon project. For improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## Resources

### Stellar Documentation
- [Stellar Docs](https://developers.stellar.org)
- [Horizon API Reference](https://developers.stellar.org/api)
- [Stellar SDK (JS)](https://github.com/stellar/js-stellar-sdk)
- [Soroban Documentation](https://developers.stellar.org/soroban)

### Wallets
- [Freighter](https://www.freighter.app)
- [Albedo](https://albedo.link)

### Tools
- [Stellar Expert](https://stellar.expert)
- [Stellar Testnet Friendbot](https://friendbot.stellar.org)

---

## License

This project is licensed under MIT. See LICENSE file for details.

---

## Support

For issues or questions:
1. Check the [Stellar Developers Discord](https://discord.gg/stellar)
2. Review the ARCHITECTURE.md for system design
3. See soroban/DEPLOYMENT.md for contract deployment help

---

**Built with ❤️ for the Stellar Network**

OrbitPath demonstrates the power of DeFi composability on Stellar, enabling fast, cheap, and transparent cross-border payments for everyone.
