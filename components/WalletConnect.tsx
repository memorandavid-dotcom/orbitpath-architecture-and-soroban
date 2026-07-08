'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getWalletManager, WalletType, WalletConnection as IWalletConnection } from '@/lib/wallets/walletManager';
import { Button } from '@/components/ui/button';

interface WalletConnectProps {
  onConnected: (connection: IWalletConnection) => void;
  onDisconnected: () => void;
  isLoading?: boolean;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnected,
  onDisconnected,
  isLoading = false,
}) => {
  const [connected, setConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<IWalletConnection | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletType[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualPublicKey, setManualPublicKey] = useState("");

  useEffect(() => {
    const walletManager = getWalletManager();
    const available = walletManager.getAvailableWallets();
    setAvailableWallets(available);
  }, []);

  const handleConnect = async (walletType: WalletType) => {
    if (walletType === 'custom') {
      setShowManualEntry(true);
      return;
    }

    setConnecting(true);
    setShowMenu(false);

    try {
      const walletManager = getWalletManager();
      const connection = await walletManager.connect(walletType);
      
      setConnected(true);
      setWalletInfo(connection);
      onConnected(connection);
      
      toast.success(`Connected to ${connection.displayName}`);
      console.log('[OrbitPath] Wallet connected:', connection);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      toast.error(message);
      console.error('[OrbitPath] Wallet connection error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleManualEntry = async () => {
    const key = manualPublicKey.trim();
    
    if (!key) {
      toast.error('Please enter a public key');
      return;
    }

    // Validate the key format before connecting
    if (!key.startsWith('G') || key.length !== 56) {
      toast.error('Invalid Stellar public key format (must start with G and be 56 characters)');
      return;
    }

    setConnecting(true);

    try {
      // Store key in sessionStorage for the adapter to retrieve
      sessionStorage.setItem('orbitpath_manual_key', key);

      const walletManager = getWalletManager();
      const connection = await walletManager.connect('custom');
      
      setConnected(true);
      setWalletInfo(connection);
      onConnected(connection);
      setShowManualEntry(false);
      setManualPublicKey('');
      
      toast.success(`Connected to ${connection.displayName}`);
      console.log('[OrbitPath] Manual wallet connected:', connection);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      toast.error(message);
      console.error('[OrbitPath] Manual wallet connection error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const walletManager = getWalletManager();
      await walletManager.disconnect();
      
      setConnected(false);
      setWalletInfo(null);
      setShowMenu(false);
      onDisconnected();
      
      console.log('[OrbitPath] Wallet disconnected');
    } catch (err) {
      console.error('[OrbitPath] Disconnect error:', err);
    }
  };

  if (connected && walletInfo) {
    return (
      <div className="relative">
        <Button
          onClick={() => setShowMenu(!showMenu)}
          variant="outline"
          className="px-4 py-2"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full" />
            <span className="text-sm font-medium">
              {walletInfo.displayName}
            </span>
            <span className="text-xs text-muted-foreground">▼</span>
          </div>
        </Button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
            <div className="p-4 border-b border-border">
              <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
              <p className="text-sm font-mono text-card-foreground break-all">
                {walletInfo.publicKey}
              </p>
            </div>
            <Button
              onClick={handleDisconnect}
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              Disconnect
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowMenu(!showMenu)}
        disabled={connecting || isLoading}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-card-foreground mb-2">
              Select Wallet
            </h3>
            <p className="text-xs text-muted-foreground">
              Choose a wallet to connect to OrbitPath
            </p>
          </div>

          <div className="p-2">
            <button
              onClick={() => handleConnect('freighter')}
              disabled={connecting}
              className="w-full text-left px-4 py-3 hover:bg-secondary rounded transition-colors text-sm text-card-foreground disabled:opacity-50 border-b border-border"
            >
              <div className="font-medium">Freighter</div>
              <div className="text-xs text-muted-foreground mt-1">
                Browser extension wallet
              </div>
            </button>
            <button
              onClick={() => handleConnect('albedo')}
              disabled={connecting}
              className="w-full text-left px-4 py-3 hover:bg-secondary rounded transition-colors text-sm text-card-foreground disabled:opacity-50 border-b border-border"
            >
              <div className="font-medium">Albedo</div>
              <div className="text-xs text-muted-foreground mt-1">
                Web-based secure signing
              </div>
            </button>
            <button
              onClick={() => handleConnect('custom')}
              disabled={connecting}
              className="w-full text-left px-4 py-3 hover:bg-secondary rounded transition-colors text-sm text-card-foreground disabled:opacity-50"
            >
              <div className="font-medium">Manual Entry</div>
              <div className="text-xs text-muted-foreground mt-1">
                Enter public key directly
              </div>
            </button>
          </div>


        </div>
      )}

      {showManualEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">
              Enter Your Stellar Public Key
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your public key starts with &apos;G&apos; and is 56 characters long.
            </p>
            
            <input
              type="text"
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={manualPublicKey}
              onChange={(e) => setManualPublicKey(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground placeholder-muted-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowManualEntry(false);
                  setManualPublicKey('');
                }}
                disabled={connecting}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleManualEntry}
                disabled={connecting || !manualPublicKey.trim()}
                className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors disabled:opacity-50"
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
