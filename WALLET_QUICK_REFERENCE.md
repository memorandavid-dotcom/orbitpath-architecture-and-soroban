# Wallet System - Quick Reference

## Get Started Fast

### Open Debug Panel
```
Press Ctrl+D (development mode only)
```

### View Wallet Logs
```
1. Press Ctrl+D
2. Click "Logs" tab
3. Filter by level dropdown
4. Click "Export Logs" to download
```

### Configure Wallets
```typescript
import { walletConfigManager } from '@/lib/wallets/config';

walletConfigManager.enableWallet('freighter');
walletConfigManager.disableWallet('albedo');
walletConfigManager.setWalletTimeout('freighter', 5000);
```

### Access Wallet Logger
```typescript
import { walletLogger } from '@/lib/wallets/logger';

// Log operations
walletLogger.info('Connect', 'Starting connection', {}, 'freighter');
walletLogger.success('Connect', 'Success', data, 'freighter');
walletLogger.error('Connect', 'Failed', error, 'freighter');

// Get logs
const logs = walletLogger.getLogs();
const errors = walletLogger.getLogsByLevel('error');
const freighterLogs = walletLogger.getLogsByWallet('freighter');
```

### Show Toast Notifications
```typescript
import { toast } from 'sonner';

toast.success('Wallet connected');
toast.error('Connection failed');
toast.warning('Please confirm');
toast.info('Loading...');
```

## File Locations

| Feature | File |
|---------|------|
| Logger | `lib/wallets/logger.ts` |
| Config | `lib/wallets/config.ts` |
| Debug Panel | `components/DebugPanel.tsx` |
| Toast Provider | `components/Toaster.tsx` |
| Dashboard | `components/WalletManagementDashboard.tsx` |
| Full Guide | `WALLET_GUIDE.md` |
| Summary | `WALLET_IMPROVEMENTS_SUMMARY.md` |

## Debug Panel Tabs

### Logs Tab
- See all wallet operations
- Filter by log level
- View timestamps
- Export logs as JSON
- Clear logs

### Config Tab
- View wallet metadata
- Toggle enable/disable
- Adjust timeouts (slider)
- See retry attempts
- Export configuration

### Status Tab
- Connection success rate %
- Total error count
- Warning count
- Enabled wallets count
- Per-wallet health status

## Common Tasks

### Check if Wallet is Installed
```typescript
const walletManager = getWalletManager();
const available = walletManager.getAvailableWallets();
console.log(available); // ['freighter', 'albedo', 'custom']
```

### Connect to a Wallet
```typescript
import { getWalletManager } from '@/lib/wallets/walletManager';

const manager = getWalletManager();
const connection = await manager.connect('freighter');
console.log(connection.publicKey);
```

### Export Configuration
```typescript
const config = walletConfigManager.exportConfig();
const blob = new Blob([config], { type: 'application/json' });
// Save blob as file
```

### Monitor Connection Success Rate
```typescript
const logs = walletLogger.getLogs();
const attempts = logs.filter(l => l.operation === 'Connect');
const successes = attempts.filter(l => l.level === 'success');
const rate = (successes.length / attempts.length) * 100;
console.log(`Success rate: ${rate}%`);
```

## Keyboard Shortcuts (Dev Mode)

| Shortcut | Action |
|----------|--------|
| Ctrl+D | Toggle Debug Panel |
| F12 | Open browser console |

## Environment Variables

No additional environment variables needed - everything is localStorage-based and configured via the UI.

## Storage

All data persists in localStorage:
- Logs: `orbitpath_wallet_logs`
- Config: `orbitpath_wallet_config`
- Max logs: 100 entries
- Manual key storage: `sessionStorage.orbitpath_manual_key`

## Errors Don't Display As

❌ Full error dumps on page  
❌ Red error banners  
❌ Stack traces in UI  

## Errors Now Display As

✅ Clean toast notifications  
✅ Bottom-right corner  
✅ Auto-dismiss after 5 seconds  
✅ Detailed logs in console (dev mode)  
✅ Stored in Debug Panel logs  

## Production vs Development

| Feature | Dev | Prod |
|---------|-----|------|
| Debug Panel | ✅ | ❌ |
| Console logs | ✅ | ❌ |
| Logger active | ✅ | ❌ |
| Toast notifications | ✅ | ✅ |
| localStorage logs | ✅ | ✅ |

## Integration Example

```typescript
import { toast } from 'sonner';
import { walletLogger } from '@/lib/wallets/logger';
import { getWalletManager } from '@/lib/wallets/walletManager';

async function handleConnect(walletType) {
  try {
    walletLogger.info('Connect', 'Starting...', {}, walletType);
    const manager = getWalletManager();
    const connection = await manager.connect(walletType);
    walletLogger.success('Connect', 'Success', connection, walletType);
    toast.success(`Connected to ${connection.displayName}`);
    return connection;
  } catch (error) {
    walletLogger.error('Connect', 'Failed', error, walletType);
    toast.error(error.message);
    throw error;
  }
}
```

## FAQ

**Q: Where are my logs?**  
A: Press Ctrl+D (dev mode) or check localStorage in DevTools → Application → Storage

**Q: How do I see stack traces?**  
A: Open F12 console - they're logged there in development mode

**Q: Can I export my logs?**  
A: Yes! Debug Panel → Logs Tab → "Export Logs" button

**Q: Do logs persist after refresh?**  
A: Yes, they're stored in localStorage (up to 100 entries)

**Q: How do I reset wallet config?**  
A: Debug Panel → Config Tab → "Reset Defaults" button

**Q: Can users see the debug panel?**  
A: No, it only appears in development mode

---

For more details, see `WALLET_GUIDE.md`
