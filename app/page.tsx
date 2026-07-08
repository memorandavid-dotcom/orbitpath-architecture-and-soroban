'use client';

import React, { useState, useCallback } from 'react';
import { PaymentForm } from '@/components/PaymentForm';
import { QuoteDisplay } from '@/components/QuoteDisplay';
import { WalletConnect } from '@/components/WalletConnect';
import { TransactionMonitor, TransactionRecord } from '@/components/TransactionMonitor';
import { PaymentQuote, PathOption, calculateSavings } from '@/lib/stellar/pathfinding';
import { WalletConnection } from '@/lib/wallets/walletManager';

export default function Dashboard() {
  const [currentQuote, setCurrentQuote] = useState<PaymentQuote | null>(null);
  const [selectedPath, setSelectedPath] = useState<PathOption | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletConnection | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuoteReceived = useCallback((quote: PaymentQuote) => {
    console.log('[OrbitPath] Quote received in dashboard:', quote);
    setCurrentQuote(quote);
    setSelectedPath(null);
    setError(null);
  }, []);

  const handlePathSelected = useCallback(async (path: PathOption) => {
    if (!walletConnected || !walletInfo) {
      setError('Please connect your wallet first');
      return;
    }

    if (!currentQuote) {
      setError('No quote available');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('[OrbitPath] Building path payment transaction:', path);

      // In production, you would:
      // 1. Build the transaction using PathPaymentBuilder
      // 2. Sign it with the wallet
      // 3. Submit it to Stellar network
      // 4. Monitor for confirmation

      // For demo purposes, simulate a transaction
      const mockTxHash = generateMockTxHash();
      const mockFee = '0.00001';
      const { amount: savingsAmount } = calculateSavings(
        parseFloat(path.sourceAmount) * 0.03, // Traditional 3% fee
        parseFloat(path.sourceAmount) * path.totalFeePercent / 100 // OrbitPath fee
      );

      // Add to transaction history
      const newTransaction: TransactionRecord = {
        hash: mockTxHash,
        sourceAmount: path.sourceAmount,
        sourceAsset: currentQuote.source.code,
        destAmount: path.destinationAmount,
        destAsset: currentQuote.destination.code,
        recipient: walletInfo.publicKey.slice(0, 8) + '...',
        status: 'success',
        timestamp: Date.now(),
        fee: mockFee,
        savings: savingsAmount.toFixed(7),
      };

      setTransactions([newTransaction, ...transactions]);
      setSelectedPath(path);

      console.log('[OrbitPath] Transaction simulated:', newTransaction);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute payment';
      setError(message);
      console.error('[OrbitPath] Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [walletConnected, walletInfo, currentQuote, transactions]);

  const handleWalletConnected = useCallback((connection: WalletConnection) => {
    setWalletConnected(true);
    setWalletInfo(connection);
    setError(null);
  }, []);

  const handleWalletDisconnected = useCallback(() => {
    setWalletConnected(false);
    setWalletInfo(null);
    setSelectedPath(null);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">OrbitPath</h1>
            <p className="text-sm text-muted-foreground">
              Intelligent cross-border payments on Stellar
            </p>
          </div>
          <WalletConnect
            onConnected={handleWalletConnected}
            onDisconnected={handleWalletDisconnected}
            isLoading={isProcessing}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        {!walletConnected ? (
          /* Wallet Connection Required */
          <div className="max-w-md mx-auto">
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">
                Welcome to OrbitPath
              </h2>
              <p className="text-muted-foreground mb-6">
                Connect your Stellar wallet to start sending money efficiently across borders.
              </p>
              <WalletConnect
                onConnected={handleWalletConnected}
                onDisconnected={handleWalletDisconnected}
              />
              <div className="mt-8 pt-8 border-t border-border text-left space-y-3">
                <h3 className="font-semibold text-card-foreground mb-3">Why OrbitPath?</h3>
                <div className="flex gap-3">
                  <span className="text-accent font-bold text-lg">⚡</span>
                  <div>
                    <p className="font-medium text-card-foreground">Fast</p>
                    <p className="text-sm text-muted-foreground">
                      Settlement in seconds on Stellar Network
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-accent font-bold text-lg">💰</span>
                  <div>
                    <p className="font-medium text-card-foreground">Cheap</p>
                    <p className="text-sm text-muted-foreground">
                      Up to 80% cheaper than traditional banking
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-accent font-bold text-lg">🔒</span>
                  <div>
                    <p className="font-medium text-card-foreground">Secure</p>
                    <p className="text-sm text-muted-foreground">
                      Non-custodial, wallet-based transactions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Main Payment Interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <PaymentForm
                  onQuoteReceived={handleQuoteReceived}
                  isLoading={isProcessing}
                />
              </div>
            </div>

            {/* Right Column - Quotes & History */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quotes Section */}
              {currentQuote && (
                <QuoteDisplay
                  quote={currentQuote}
                  onPathSelected={handlePathSelected}
                  isLoading={isProcessing}
                />
              )}

              {/* Selected Path Info */}
              {selectedPath && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-accent mb-3">
                    Path Selected
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your payment is ready to send. In a production environment, you would now
                    sign this transaction with your wallet and submit it to the Stellar network.
                  </p>
                  <div className="text-sm font-mono text-accent bg-background p-3 rounded">
                    PathPaymentStrictReceive configured for{' '}
                    {selectedPath.destinationAmount} {currentQuote?.destination.code}
                  </div>
                </div>
              )}

              {/* Transaction History */}
              {transactions.length > 0 && (
                <div>
                  <TransactionMonitor transactions={transactions} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-card-foreground mb-3">About</h3>
              <p className="text-sm text-muted-foreground">
                OrbitPath is an intelligent routing layer for the Stellar Network, making
                cross-border payments fast, cheap, and reliable.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground mb-3">Powered By</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Stellar Network</li>
                <li>Soroban Smart Contracts</li>
                <li>Stellar DEX &amp; AMMs</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground mb-3">Network</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  <span className="text-primary">●</span> Testnet (Demo)
                </div>
                <p className="text-xs mt-2">
                  This is a demonstration using Stellar Testnet. Use test XLM from friendbot.
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-xs text-muted-foreground">
            <p>OrbitPath • Hackathon Project • DeFi &amp; Ecosystem Composability</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function generateMockTxHash(): string {
  const chars = 'abcdef0123456789';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}
