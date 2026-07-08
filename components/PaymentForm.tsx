'use client';

import React, { useState, useCallback } from 'react';
import { PathFinder, ConversionAsset, PaymentQuote } from '@/lib/stellar/pathfinding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PaymentFormProps {
  onQuoteReceived: (quote: PaymentQuote) => void;
  isLoading?: boolean;
}

const RECOMMENDED_ASSETS = [
  { code: 'XLM', issuer: 'native', name: 'Stellar Lumens' },
  { code: 'USDC', issuer: 'GBBD47UZE5D3V7H23C7FC7UD3UGC3QMQQ5FLHWBQKOXR7PQBHZGVVKQF', name: 'USD Coin' },
  { code: 'EURD', issuer: 'GAKBPHO2PHRLQQ5V4F2HB3XRVS537MZPR3J5RBQDDG43NGAXVUJJNRO5', name: 'Euro Stablecoin' },
];

export const PaymentForm: React.FC<PaymentFormProps> = ({ onQuoteReceived, isLoading = false }) => {
  const [sourceAsset, setSourceAsset] = useState<ConversionAsset>(RECOMMENDED_ASSETS[0]);
  const [destinationAsset, setDestinationAsset] = useState<ConversionAsset>(RECOMMENDED_ASSETS[2]);
  const [sourceAmount, setSourceAmount] = useState('100');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetQuote = useCallback(async () => {
    if (!sourceAmount || parseFloat(sourceAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const pathFinder = new PathFinder('testnet');
      const quote = await pathFinder.findOptimalPath(
        sourceAsset,
        destinationAsset,
        sourceAmount,
        { maxPaths: 5 }
      );
      
      console.log('[OrbitPath] Quote received:', quote);
      onQuoteReceived(quote);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to find payment paths';
      setError(message);
      console.error('[OrbitPath] Quote error:', err);
    } finally {
      setSearching(false);
    }
  }, [sourceAsset, destinationAsset, sourceAmount, onQuoteReceived]);

  const handleSwapAssets = () => {
    setSourceAsset(destinationAsset);
    setDestinationAsset(sourceAsset);
  };

  return (
    <div className="w-full bg-card rounded-lg border border-border p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-6 text-card-foreground">Send Money</h2>

      {/* Source Asset Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          You send
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="number"
              value={sourceAmount}
              onChange={(e) => setSourceAmount(e.target.value)}
              placeholder="Amount"
              disabled={searching || isLoading}
              className="w-full"
            />
          </div>
          <select
            value={`${sourceAsset.code}:${sourceAsset.issuer}`}
            onChange={(e) => {
              const asset = RECOMMENDED_ASSETS.find(
                (a) => `${a.code}:${a.issuer}` === e.target.value
              );
              if (asset) setSourceAsset(asset);
            }}
            disabled={searching || isLoading}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm font-medium hover:bg-secondary disabled:opacity-50"
          >
            {RECOMMENDED_ASSETS.map((asset) => (
              <option
                key={`${asset.code}:${asset.issuer}`}
                value={`${asset.code}:${asset.issuer}`}
              >
                {asset.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center mb-6">
        <Button
          onClick={handleSwapAssets}
          variant="outline"
          size="sm"
          disabled={searching || isLoading}
          className="px-3"
        >
          ⇅
        </Button>
      </div>

      {/* Destination Asset Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          They receive
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Amount will be calculated"
              disabled
              className="w-full"
            />
          </div>
          <select
            value={`${destinationAsset.code}:${destinationAsset.issuer}`}
            onChange={(e) => {
              const asset = RECOMMENDED_ASSETS.find(
                (a) => `${a.code}:${a.issuer}` === e.target.value
              );
              if (asset) setDestinationAsset(asset);
            }}
            disabled={searching || isLoading}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm font-medium hover:bg-secondary disabled:opacity-50"
          >
            {RECOMMENDED_ASSETS.map((asset) => (
              <option
                key={`${asset.code}:${asset.issuer}`}
                value={`${asset.code}:${asset.issuer}`}
              >
                {asset.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Get Quote Button */}
      <Button
        onClick={handleGetQuote}
        disabled={searching || isLoading}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {searching || isLoading ? 'Finding best rates...' : 'Get Best Rate'}
      </Button>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Real-time quotes expire in 30 seconds. Rates update every 5 seconds.
      </p>
    </div>
  );
};

export default PaymentForm;
