# OrbitPath Soroban Contract - Deployment Guide

## Overview

This document covers deploying the OrbitPath smart contract to the Stellar Network using Soroban.

## Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add wasm32 target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli

# Install Node.js dependencies for testing
npm install -g stellar-sdk soroban-rpc
```

## Build the Contract

```bash
cd soroban/

# Build for Testnet (debug mode)
soroban contract build --profile test

# Build for Production (optimized)
soroban contract build --profile release
```

Output WASM binary: `soroban/target/wasm32-unknown-unknown/release/orbitpath_contract.wasm`

## Deploy to Stellar Testnet

### Step 1: Setup Testnet Account

```bash
# Create new keypair (save securely!)
soroban keys generate mykey

# Fund account via friendbot (Testnet only)
curl "https://friendbot.stellar.org/?addr=$(soroban keys address mykey)"

# Verify funding
soroban rpc getAccount -k mykey --network testnet
```

### Step 2: Deploy Contract

```bash
# Deploy to Testnet
soroban contract deploy \
  --wasm soroban/target/wasm32-unknown-unknown/release/orbitpath_contract.wasm \
  --source mykey \
  --network testnet

# Output: Contract ID (e.g., CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4)
```

Save the Contract ID - you'll need it for all interactions.

### Step 3: Initialize Contract State

```bash
# Set contract environment variables
export CONTRACT_ID="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4"
export NETWORK="testnet"
export ACCOUNT_ID=$(soroban keys address mykey)
```

## Invoke Contract Functions

### Example 1: Evaluate a Path

```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source mykey \
  --network $NETWORK \
  -- \
  evaluate_path \
  --source_asset '{
    "asset_code": "WExMTQAAAAAAAAAAAA==",
    "issuer": "GBUQWP3BOUZX34ULNQG23RQ6F4BWFIDBBBLU4YW2DC2Y5YHOJOZB56V"
  }' \
  --destination_asset '{
    "asset_code": "VVNEURAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6Q=",
    "issuer": "GBUQWP3BOUZX34ULNQG23RQ6F4BWFIDBBBLU4YW2DC2Y5YHOJOZB56V"
  }' \
  --send_amount 1000000 \
  --path_assets '[]'
```

### Example 2: Select Optimal Path

```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source mykey \
  --network $NETWORK \
  -- \
  select_optimal_path \
  --paths '[...]' \
  --min_liquidity_requirement 5000000
```

### Example 3: Store a Payment Route

```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source mykey \
  --network $NETWORK \
  -- \
  store_route \
  --route_id "route_001" \
  --route '{
    "user": "'$ACCOUNT_ID'",
    "source_amount": 1000000,
    "executed": false
  }'
```

### Example 4: Execute Payment

```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source mykey \
  --network $NETWORK \
  -- \
  execute_payment \
  --route_id "route_001" \
  --current_rate 1500000 \
  --current_liquidity 10000000000
```

## Deploy to Stellar Public Network

### Important: Mainnet Deployment

⚠️ **WARNING:** Mainnet deployment is permanent and costs real lumens. Test thoroughly on Testnet first.

```bash
# Fund mainnet account (you must transfer XLM via exchange)
export MAINNET_KEY="your-mainnet-keypair"

# Deploy to mainnet
soroban contract deploy \
  --wasm soroban/target/wasm32-unknown-unknown/release/orbitpath_contract.wasm \
  --source $MAINNET_KEY \
  --network public

# Save Contract ID
export MAINNET_CONTRACT_ID="your-mainnet-contract-id"
```

## Testing

### Run Unit Tests

```bash
cd soroban/
cargo test --target wasm32-unknown-unknown
```

### Integration Testing with JavaScript

```bash
# From project root
npm install @stellar/stellar-sdk soroban-rpc

# Create test file: tests/soroban.test.js
node tests/soroban.test.js
```

Example test file:

```javascript
const SorobanRpc = require('soroban-rpc');
const sdk = require('@stellar/stellar-sdk');

const contractId = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4';
const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org');

async function testPathEvaluation() {
  const sourceAsset = {
    asset_code: 'XLM',
    issuer: 'GBUQWP3BOUZX34ULNQG23RQ6F4BWFIDBBBLU4YW2DC2Y5YHOJOZB56V'
  };

  const destAsset = {
    asset_code: 'USDC',
    issuer: 'GBUQWP3BOUZX34ULNQG23RQ6F4BWFIDBBBLU4YW2DC2Y5YHOJOZB56V'
  };

  try {
    const result = await server.simulateTransaction(
      // Build transaction with contract call
      // ...
    );
    
    console.log('Path evaluation result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testPathEvaluation();
```

## Monitoring & Debugging

### View Contract Events

```bash
# Get events from contract
soroban rpc getEvents \
  --network testnet \
  --contract $CONTRACT_ID \
  --start-ledger 1000000
```

### Check Contract State

```bash
# View persistent storage
soroban rpc getLedgerEntries \
  --network testnet \
  --contract-data $CONTRACT_ID
```

### View Transaction Details

```bash
# After execution
soroban rpc getTransaction \
  --network testnet \
  --hash "your-tx-hash"
```

## Costs & Fees

### Deployment Costs (Testnet)

- Contract upload: ~100 XLM
- Account creation: Free (friendbot)

### Operation Costs (All Networks)

- Base transaction fee: 100 stroops (0.00001 XLM)
- Contract invocation: Variable (depends on complexity)
- Storage rent (optional): ~0.5 XLM/week per contract

### Optimization Tips

1. **Minimize state storage** - Only store essential data
2. **Batch operations** - Combine multiple calls when possible
3. **Cache results** - Pre-compute path evaluations
4. **Use events** - Emit events instead of storing unnecessary state

## Production Checklist

- [ ] Contract thoroughly tested on Testnet
- [ ] Security audit completed (recommended)
- [ ] Mainnet keypair secured (hardware wallet/multisig)
- [ ] Sufficient XLM balance for deployment (>1000 XLM)
- [ ] CI/CD pipeline configured for contract updates
- [ ] Monitoring & alerting set up
- [ ] Incident response plan documented
- [ ] Contract verified on Stellar Expert (optional)

## Contract Upgrades

Note: Soroban contracts are immutable once deployed. To upgrade:

1. Deploy new contract version
2. Update frontend/SDK to use new contract ID
3. Migrate state if necessary (manual process)

## Support & Resources

- **Soroban Docs:** https://developers.stellar.org/soroban
- **Stellar JS SDK:** https://github.com/stellar/js-stellar-sdk
- **Horizon API:** https://developers.stellar.org/api/introduction
- **Soroban CLI:** `soroban --help`

## Troubleshooting

### Contract Build Fails

```bash
# Clear build cache and rebuild
cargo clean
soroban contract build --profile release
```

### Deployment Insufficient Balance

```bash
# Fund account again
curl "https://friendbot.stellar.org/?addr=$(soroban keys address mykey)"
```

### Contract Invocation Timeout

- Increase simulation timeout
- Reduce contract complexity
- Check network connectivity to Soroban RPC

## Next Steps

1. Integrate contract ID into frontend SDK
2. Build JavaScript wrapper functions
3. Set up monitoring dashboard
4. Create anchor integration layer
5. Launch beta testing program
