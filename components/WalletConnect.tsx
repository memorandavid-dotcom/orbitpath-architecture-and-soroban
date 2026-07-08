'use client';

import React, { useState, useEffect } from 'react';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const walletManager = getWalletManager();
    const available = walletManager.getAvailableWallets();
    setAvailableWallets(available);
  }, []);

  const handleConnect = async (walletType: WalletType) => {
    setConnecting(true);
    setError(null);
    setShowMenu(false);

    try {
      const walletManager = getWalletManager();
      const connection = await walletManager.connect(walletType);
      
      setConnected(true);
      setWalletInfo(connection);
      onConnected(connection);
      
      console.log('[OrbitPath] Wallet connected:', connection);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      console.error('[OrbitPath] Wallet connection error:', err);
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
            {availableWallets.length > 0 ? (
              availableWallets.map((walletType) => (
                <button
                  key={walletType}
                  onClick={() => handleConnect(walletType)}
                  disabled={connecting}
                  className="w-full text-left px-4 py-3 hover:bg-secondary rounded transition-colors text-sm text-card-foreground disabled:opacity-50"
                >
                  <div className="font-medium capitalize">
                    {walletType === 'custom' ? 'Manual Entry' : walletType}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {walletType === 'freighter'
                      ? 'Browser extension wallet'
                      : walletType === 'albedo'
                      ? 'Web-based secure signing'
                      : 'Enter public key manually'}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No wallets detected. Install Freighter or use Albedo.
              </div>
            )}
          </div>

          {error && (
            <div className="m-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
