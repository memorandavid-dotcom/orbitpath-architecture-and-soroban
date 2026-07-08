'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export interface TransactionRecord {
  hash: string;
  sourceAmount: string;
  sourceAsset: string;
  destAmount: string;
  destAsset: string;
  recipient: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  fee: string;
  savings: string;
}

interface TransactionMonitorProps {
  transactions?: TransactionRecord[];
  isLoading?: boolean;
}

export const TransactionMonitor: React.FC<TransactionMonitorProps> = ({
  transactions = [],
  isLoading = false,
}) => {
  const [expandedHash, setExpandedHash] = useState<string | null>(null);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: string, decimals = 2): string => {
    const num = parseFloat(amount);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const truncateHash = (hash: string): string => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const getStatusColor = (
    status: 'pending' | 'success' | 'failed'
  ): string => {
    switch (status) {
      case 'success':
        return 'text-accent';
      case 'pending':
        return 'text-primary';
      case 'failed':
        return 'text-destructive';
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'failed'): string => {
    switch (status) {
      case 'success':
        return '✓';
      case 'pending':
        return '⏳';
      case 'failed':
        return '✗';
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="w-full bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground mb-3">No transactions yet</p>
        <p className="text-sm text-muted-foreground">
          Your payment history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">
        Recent Transactions
      </h3>

      {transactions.map((tx, index) => {
        const isExpanded = expandedHash === tx.hash;

        return (
          <div
            key={tx.hash}
            className="bg-card border border-border rounded-lg overflow-hidden"
          >
            {/* Header - Always Visible */}
            <button
              onClick={() => setExpandedHash(isExpanded ? null : tx.hash)}
              className="w-full p-4 hover:bg-secondary transition-colors text-left"
              disabled={isLoading}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Status & Amount */}
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`flex items-center justify-center w-6 h-6 rounded-full border ${
                        tx.status === 'success'
                          ? 'bg-accent/10 border-accent text-accent'
                          : tx.status === 'pending'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-destructive/10 border-destructive text-destructive'
                      }`}
                    >
                      {getStatusIcon(tx.status)}
                    </span>
                    <p className={`text-sm font-medium capitalize ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </p>
                  </div>

                  {/* Amount Details */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Sent</p>
                      <p className="font-semibold text-card-foreground">
                        {formatAmount(tx.sourceAmount)} {tx.sourceAsset}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Received</p>
                      <p className="font-semibold text-accent">
                        {formatAmount(tx.destAmount)} {tx.destAsset}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Time</p>
                      <p className="font-semibold text-card-foreground text-xs">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expand Icon */}
                <div className="ml-4 text-muted-foreground">
                  {isExpanded ? '▼' : '▶'}
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-border bg-background p-4 space-y-4">
                {/* Transaction Hash */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">
                    Transaction Hash
                  </h4>
                  <code className="text-sm text-card-foreground font-mono bg-muted px-3 py-2 rounded block break-all">
                    {tx.hash}
                  </code>
                </div>

                {/* Recipient */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">
                    Recipient
                  </h4>
                  <code className="text-sm text-card-foreground font-mono bg-muted px-3 py-2 rounded block break-all">
                    {tx.recipient}
                  </code>
                </div>

                {/* Fee & Savings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Network Fee</p>
                    <p className="font-semibold text-card-foreground text-sm">
                      {tx.fee} XLM
                    </p>
                  </div>
                  <div className="p-3 bg-accent/10 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Amount Saved</p>
                    <p className="font-semibold text-accent text-sm">
                      {tx.savings} {tx.sourceAsset}
                    </p>
                  </div>
                </div>

                {/* View on Horizon */}
                <Button
                  onClick={() => {
                    const horizonUrl = `https://horizon.stellar.org/transactions/${tx.hash}`;
                    window.open(horizonUrl, '_blank');
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  View on Stellar Horizon →
                </Button>

                {/* Copy Hash */}
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(tx.hash);
                  }}
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                >
                  Copy Transaction Hash
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TransactionMonitor;
