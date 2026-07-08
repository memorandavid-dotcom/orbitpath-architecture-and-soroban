# OrbitPath Wallet Management Guide

## Overview

This guide explains how to manage wallet adapters, edit them, work across repositories, configure them, and debug issues.

## 1. Wallet Architecture

Wallets in OrbitPath are modular and extensible:

```
lib/wallets/
├── walletManager.ts       # Main wallet manager & adapters
├── config.ts              # Wallet configuration system
├── logger.ts              # Wallet operation logging
└── [custom-adapters]/     # Additional wallet implementations
```

## 2. Quick Start: Understanding Wallet Adapters

All wallet adapters inherit from `WalletAdapter` base class:

```typescript
export abstract class WalletAdapter {
  abstract type: WalletType;
  abstract connect(): Promise<WalletConnection>;
  abstract disconnect(): Promise<void>;
  abstract getPublicKey(): Promise<string>;
  abstract isInstalled(): boolean;
  abstract signTransaction(transactionXdr: string): Promise<SigningResult>;
  abstract signMessage(message: string): Promise<SigningResult>;
  abstract isConnected(): boolean;
}
```

### Built-in Adapters

1. **FreighterAdapter** - Browser extension wallet (Freighter)
2. **AlbedoAdapter** - Web-based secure signing (Albedo)
3. **ManualEntryAdapter** - Direct public key input

## 3. Wallet Configuration Management

### View Current Config

```typescript
import { walletConfigManager } from '@/lib/wallets/config';

// Get all configuration
const config = walletConfigManager.getConfig();

// Check if wallet is enabled
const freighterEnabled = walletConfigManager.isWalletEnabled('freighter');

// Get enabled wallets sorted by priority
const enabledWallets = walletConfigManager.getEnabledWallets();
```

### Customize Wallet Settings

```typescript
// Disable a wallet
walletConfigManager.disableWallet('albedo');

// Enable a wallet
walletConfigManager.enableWallet('freighter');

// Set custom timeout (in milliseconds)
walletConfigManager.setWalletTimeout('freighter', 3000);

// Export configuration for backup
const configJson = walletConfigManager.exportConfig();

// Import configuration
walletConfigManager.importConfig(configJson);

// Reset to defaults
walletConfigManager.resetToDefaults();
```

### Configuration Format

Each wallet has:
- `name` - Display name
- `description` - User-friendly description
- `enabled` - Whether the wallet is available
- `timeout` - Connection timeout in milliseconds
- `retryAttempts` - Number of retry attempts
- `priority` - Display order (lower = higher priority)
- `requiresExtension` - Needs browser extension
- `supportsOfflineMode` - Can work without network
- `supportedNetworks` - Compatible networks (testnet, mainnet, etc.)

## 4. Wallet Logging & Debugging

### Enable Debug Panel

Press `Ctrl+D` in development mode to toggle the Debug Panel. The panel shows:
- **Logs Tab** - All wallet operations with timestamps and log levels
- **Config Tab** - Current wallet configuration and settings
- **Status Tab** - System status and error counts

### Access Logs Programmatically

```typescript
import { walletLogger } from '@/lib/wallets/logger';

// Get all logs
const allLogs = walletLogger.getLogs();

// Get recent logs
const recent = walletLogger.getRecentLogs(10);

// Filter by level
const errors = walletLogger.getLogsByLevel('error');

// Filter by wallet
const freighterLogs = walletLogger.getLogsByWallet('freighter');

// Filter by operation
const connectLogs = walletLogger.getLogsByOperation('Connect');

// Export logs for analysis
const logJson = walletLogger.exportLogs();

// Clear logs
walletLogger.clearLogs();
```

### Log Levels

- `info` - General informational messages (blue)
- `success` - Successful operations (green)
- `warning` - Warnings that don't prevent operation (yellow)
- `error` - Critical errors (red)
- `debug` - Detailed debugging information (purple)

## 5. Error Handling

Errors are now displayed as clean toast notifications instead of full error dumps.

### Toast Notifications

```typescript
import { toast } from 'sonner';

// Show error
toast.error('Failed to connect wallet');

// Show success
toast.success('Wallet connected successfully');

// Show warning
toast.warning('This action requires confirmation');

// Show info
toast.info('Connecting wallet...');
```

All wallet errors automatically convert to toast notifications. No need to handle display separately.

## 6. Creating Custom Wallet Adapters

To add a custom wallet implementation:

### Step 1: Create Adapter Class

```typescript
// lib/wallets/adapters/customWallet.ts
import { WalletAdapter, WalletConnection, SigningResult } from '../walletManager';
import { walletLogger } from '../logger';

export class CustomWalletAdapter extends WalletAdapter {
  type: 'custom-wallet' = 'custom-wallet';
  private publicKey: string | null = null;

  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!(window as any).customWallet;
  }

  async connect(): Promise<WalletConnection> {
    walletLogger.info('Connect', 'Attempting custom wallet connection', {}, 'custom-wallet');
    
    try {
      const pubKey = await (window as any).customWallet.getPublicKey();
      this.publicKey = pubKey;
      
      return {
        type: 'custom-wallet',
        publicKey: pubKey,
        displayName: `Custom Wallet: ${pubKey.slice(0, 8)}...`,
        isConnected: true,
      };
    } catch (error) {
      walletLogger.error('Connect', 'Connection failed', error, 'custom-wallet');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.publicKey = null;
  }

  async getPublicKey(): Promise<string> {
    if (!this.publicKey) throw new Error('Not connected');
    return this.publicKey;
  }

  isConnected(): boolean {
    return this.publicKey !== null;
  }

  async signTransaction(xdr: string): Promise<SigningResult> {
    if (!this.isConnected()) throw new Error('Not connected');
    
    const signed = await (window as any).customWallet.sign(xdr);
    return {
      signedXDR: signed,
      publicKey: this.publicKey!,
    };
  }

  async signMessage(message: string): Promise<SigningResult> {
    if (!this.isConnected()) throw new Error('Not connected');
    
    const signed = await (window as any).customWallet.signMessage(message);
    return {
      signedXDR: signed,
      publicKey: this.publicKey!,
    };
  }
}
```

### Step 2: Register Adapter

In `lib/wallets/walletManager.ts`, add to the `WalletManager` constructor:

```typescript
import { CustomWalletAdapter } from './adapters/customWallet';

constructor() {
  this.adapters.set('freighter', new FreighterAdapter());
  this.adapters.set('albedo', new AlbedoAdapter());
  this.adapters.set('custom', new ManualEntryAdapter());
  this.adapters.set('custom-wallet', new CustomWalletAdapter()); // Add here
}
```

### Step 3: Update Type Definitions

In the same file, update the `WalletType`:

```typescript
export type WalletType = "freighter" | "albedo" | "custom" | "custom-wallet";
```

## 7. Working Across Repositories

### Option A: Separate Wallet Package

Create a dedicated wallet package:

```
orbitpath-wallets/
├── src/
│   ├── adapters/
│   │   ├── freighter.ts
│   │   ├── albedo.ts
│   │   └── custom.ts
│   ├── config.ts
│   ├── logger.ts
│   └── manager.ts
├── package.json
└── dist/
```

**In main OrbitPath repo:**

```json
{
  "dependencies": {
    "@orbitpath/wallets": "npm:file:../orbitpath-wallets/dist"
  }
}
```

**Usage:**

```typescript
import { WalletManager } from '@orbitpath/wallets';
import { walletConfigManager } from '@orbitpath/wallets';

const walletManager = new WalletManager();
```

### Option B: Git Submodule

```bash
git submodule add https://github.com/yourorg/orbitpath-wallets lib/wallets-external
```

Then import from the submodule directory.

## 8. Monitoring & Performance

### Check Wallet Health

```typescript
import { walletLogger } from '@/lib/wallets/logger';

// Get error count
const errors = walletLogger.getLogsByLevel('error').length;

// Check connection success rate
const attempts = walletLogger.getLogsByOperation('Connect');
const successes = attempts.filter(l => l.level === 'success').length;
const successRate = (successes / attempts.length) * 100;

console.log(`Wallet connection success rate: ${successRate}%`);
```

### Performance Metrics

```typescript
// Track connection time
const startTime = Date.now();
await walletManager.connect('freighter');
const connectionTime = Date.now() - startTime;

walletLogger.info(
  'Performance',
  `Connection took ${connectionTime}ms`,
  { connectionTime },
  'freighter'
);
```

## 9. Production Best Practices

1. **Always use Ctrl+D debug panel in development** - Never in production
2. **Monitor error logs** - Check error counts regularly
3. **Test timeout values** - Adjust based on your network conditions
4. **Clear old logs** - Prevent localStorage bloat with `walletLogger.clearLogs()`
5. **Validate configuration** - Export and version control wallet configs
6. **Use feature flags** - Disable problematic wallets without redeploying

## 10. Troubleshooting

### Wallet Not Connecting

**Check:**
```typescript
// 1. Is wallet installed?
const freighter = walletConfigManager.getWalletMetadata('freighter');
console.log('Freighter installed:', freighter);

// 2. Check recent logs
const logs = walletLogger.getRecentLogs(5);
console.table(logs);

// 3. Is it enabled?
const enabled = walletConfigManager.isWalletEnabled('freighter');
console.log('Freighter enabled:', enabled);
```

### Timeout Issues

Adjust timeout for slow networks:

```typescript
walletConfigManager.setWalletTimeout('freighter', 10000); // 10 seconds
```

### Unexpected Errors

1. Open Debug Panel (Ctrl+D)
2. Check Logs tab for detailed error messages
3. Export logs: Click "Export Config" button
4. Review error stack traces in console (F12)

## References

- [Stellar Wallet Documentation](https://developers.stellar.org/docs/wallets)
- [Freighter Wallet](https://www.freighter.app/)
- [Albedo Wallet](https://albedo.link/)
- [Sonner Toast Notifications](https://sonner.emilkowal.ski/)
