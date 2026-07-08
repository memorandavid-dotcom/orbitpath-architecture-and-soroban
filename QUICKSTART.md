# OrbitPath Quick Start Guide

Get OrbitPath running in 5 minutes.

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Start Development Server

```bash
pnpm dev
```

The app runs at `http://localhost:3000`

## 3. Setup Testnet Wallet

### Option A: Use Freighter (Browser Extension)
1. Install [Freighter](https://www.freighter.app)
2. Create or import a keypair
3. Fund with testnet XLM (see step 4)

### Option B: Use Albedo (Web-based)
1. Visit the app and click "Connect Wallet"
2. Select Albedo
3. Approve in popup

## 4. Get Testnet XLM

```bash
# Get your public key from wallet
# Then fund it:
curl "https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY"
```

Or use the Stellar Laboratory: https://laboratory.stellar.org

## 5. Make Your First Payment

1. Click "Connect Wallet" and authorize
2. Enter send amount (e.g., 100 XLM)
3. Select source and destination assets
4. Click "Get Best Rate"
5. Review available paths and select one
6. In production, sign and submit the transaction

## Key Files to Explore

- **`app/page.tsx`** - Main dashboard
- **`lib/stellar/pathfinding.ts`** - Path discovery logic
- **`lib/wallets/walletManager.ts`** - Wallet integration
- **`ARCHITECTURE.md`** - System design overview
- **`soroban/src/lib.rs`** - Smart contract

## API Examples

### Find Optimal Path

```typescript
import { PathFinder } from '@/lib/stellar/pathfinding';

const finder = new PathFinder('testnet');
const quote = await finder.findOptimalPath(
  { code: 'XLM', issuer: 'native' },
  { code: 'USDC', issuer: 'GBBD47UZE5D3V7H23C7FC7UD3UGC3QMQQ5FLHWBQKOXR7PQBHZGVVKQF' },
  '100'
);

console.log(quote.optimalPath);
console.log(quote.alternativePaths);
```

### Build PathPayment Transaction

```typescript
import { PathPaymentBuilder } from '@/lib/stellar/pathPayment';

const builder = new PathPaymentBuilder('testnet');
const tx = await builder.buildPathPaymentStrictReceive({
  source: 'GBUQWP3BOUZX34ULNQG23RQ6F4BWFIDBBBLU4YW2DC2Y5YHOJOZB56V',
  destination: 'GAEB4MRKRCONK45IA7CZYWDTUS76NEB6LBN7IJLCJT5B5TR4CF6X2H2',
  destinationAsset: { code: 'USDC', issuer: '...' },
  destinationAmount: '100',
  sendAsset: { code: 'XLM', issuer: 'native' },
  sendMaxAmount: '150',
  path: [],
});
```

### Connect Wallet

```typescript
import { getWalletManager } from '@/lib/wallets/walletManager';

const manager = getWalletManager();
const connection = await manager.connect('freighter');
console.log('Connected:', connection.publicKey);

const signed = await manager.signTransaction(tx);
```

## Common Tasks

### Deploy Smart Contract

```bash
cd soroban/
soroban contract build --profile release
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/orbitpath_contract.wasm \
  --source mykey \
  --network testnet
```

See `soroban/DEPLOYMENT.md` for details.

### Customize Theme

Edit `app/globals.css` to change colors, spacing, and design tokens.

### Add More Assets

Update `RECOMMENDED_ASSETS` in `components/PaymentForm.tsx`:

```typescript
const RECOMMENDED_ASSETS = [
  { code: 'XLM', issuer: 'native', name: 'Stellar Lumens' },
  { code: 'USDC', issuer: '...', name: 'USD Coin' },
  { code: 'YOUR_ASSET', issuer: '...', name: 'Your Asset' },
];
```

## Debugging

Enable debug logging:

```typescript
// These statements use console.log with [v0] prefix
console.log('[OrbitPath] Debug message:', data);
```

Check browser DevTools console for logs.

## Production Checklist

- [ ] Test all paths on Testnet thoroughly
- [ ] Security audit of Soroban contract
- [ ] Mainnet wallet setup with hardware security
- [ ] Deploy contract to public network
- [ ] Update environment variables
- [ ] Setup monitoring and alerts
- [ ] Create incident response plan

## Next Steps

1. **Read ARCHITECTURE.md** for full system design
2. **Explore soroban/DEPLOYMENT.md** for contract details
3. **Review lib/stellar/** for SDK implementation
4. **Build additional features** (anchor integration, advanced analytics, etc.)
5. **Deploy to production** after security review

## Useful Links

- [Stellar Documentation](https://developers.stellar.org)
- [Horizon API](https://developers.stellar.org/api)
- [Soroban Contracts](https://developers.stellar.org/soroban)
- [Freighter Wallet](https://www.freighter.app)
- [Albedo Wallet](https://albedo.link)
- [Stellar Expert](https://stellar.expert)

## Support

- Issues? Check the README.md Troubleshooting section
- Questions? Visit the Stellar Developers Discord
- Code? See the full source in the repository

Happy building!
