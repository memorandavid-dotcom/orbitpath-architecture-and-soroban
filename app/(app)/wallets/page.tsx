'use client';

import React, { useState } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { WalletConnection } from '@/lib/wallets/walletManager';
import { toast } from 'sonner';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletConnection[]>([
    {
      type: 'freighter',
      publicKey: 'GBUTQWPVY5H4SRHAL3QCA3D6F86ARCQVWWPOR4AWFBEOFIVD5ZLLYG7',
      displayName: 'Freighter Wallet',
      isConnected: true,
    },
  ]);

  const handleWalletConnected = (wallet: WalletConnection) => {
    setWallets([...wallets, wallet]);
    toast.success(`${wallet.displayName} connected successfully`);
  };

  const handleDisconnect = (publicKey: string) => {
    setWallets(wallets.filter((w) => w.publicKey !== publicKey));
    toast.success('Wallet disconnected');
  };

  const handleSetDefault = (publicKey: string) => {
    setWallets(
      wallets.map((w) => ({
        ...w,
        isDefault: w.publicKey === publicKey,
      }))
    );
    toast.success('Default wallet updated');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">Manage Wallets</h1>
      <p className="text-muted-foreground mb-8">
        Connect and manage your Stellar wallets for cross-border payments
      </p>

      {/* Connected Wallets */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-4">Connected Wallets</h2>
        
        {wallets.length > 0 ? (
          <div className="space-y-4">
            {wallets.map((wallet) => (
              <div
                key={wallet.publicKey}
                className="bg-card border border-border rounded-lg p-6 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {wallet.type === 'freighter'
                        ? '🦊'
                        : wallet.type === 'albedo'
                        ? '🔐'
                        : '📝'}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{wallet.displayName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {wallet.publicKey.slice(0, 16)}...{wallet.publicKey.slice(-8)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {wallet.isDefault && (
                    <span className="px-3 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full">
                      Default
                    </span>
                  )}
                  <button
                    onClick={() => handleSetDefault(wallet.publicKey)}
                    className="px-4 py-2 text-sm font-medium bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition"
                  >
                    Set as Default
                  </button>
                  <button
                    onClick={() => handleDisconnect(wallet.publicKey)}
                    className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-secondary/50 border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-4">No wallets connected yet</p>
          </div>
        )}
      </div>

      {/* Connect New Wallet */}
      <div className="bg-card border border-border rounded-lg p-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Connect New Wallet</h2>
        <p className="text-muted-foreground mb-6">
          Choose a wallet type to connect. Your private keys never leave your device.
        </p>
        
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            <WalletConnect
              onConnected={handleWalletConnected}
              onDisconnected={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-12 bg-primary/10 border border-primary/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary mb-2">Security Tips</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Never share your private keys or seed phrases</li>
          <li>• Only use wallets on secure, trusted devices</li>
          <li>• Verify wallet addresses before sending funds</li>
          <li>• Keep your browser and extensions updated</li>
        </ul>
      </div>
    </div>
  );
}
