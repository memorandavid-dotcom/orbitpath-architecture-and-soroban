'use client';

import React, { useState } from 'react';
import { PaymentQuote, PathOption } from '@/lib/stellar/pathfinding';
import { Button } from '@/components/ui/button';

interface QuoteDisplayProps {
  quote: PaymentQuote | null;
  onPathSelected: (path: PathOption) => void;
  isLoading?: boolean;
}

export const QuoteDisplay: React.FC<QuoteDisplayProps> = ({
  quote,
  onPathSelected,
  isLoading = false,
}) => {
  const [expandedPath, setExpandedPath] = useState<number | null>(0);

  if (!quote) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Enter payment details and click "Get Best Rate" to see conversion paths</p>
      </div>
    );
  }

  const formatAmount = (amount: string | number, decimals = 2): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatAssetCode = (code: string): string => {
    return code === 'XLM' ? 'XLM' : code;
  };

  const renderPath = (path: PathOption, index: number): React.ReactNode => {
    const isExpanded = expandedPath === index;

    return (
      <div key={index} className="border border-border rounded-lg overflow-hidden mb-3">
        {/* Header - Always Visible */}
        <button
          onClick={() => setExpandedPath(isExpanded ? null : index)}
          className="w-full p-4 bg-card hover:bg-secondary transition-colors text-left"
          disabled={isLoading}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {index === 0 && <span className="px-2 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded">Best Rate</span>}
                <span className="text-sm font-medium text-muted-foreground">
                  {path.hops} hop{path.hops !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">You send</p>
                  <p className="text-lg font-semibold text-card-foreground">
                    {formatAmount(path.sourceAmount)} {quote.source.code}
                  </p>
                </div>

                <div className="text-2xl text-muted-foreground">→</div>

                <div>
                  <p className="text-sm text-muted-foreground">They receive</p>
                  <p className="text-lg font-semibold text-accent">
                    {formatAmount(path.destinationAmount)} {quote.destination.code}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Fee</p>
                  <p className="text-lg font-semibold text-primary">
                    {path.totalFeePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="ml-4 text-muted-foreground text-xl">
              {isExpanded ? '▼' : '▶'}
            </div>
          </div>
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-border bg-background p-4">
            {/* Path Details */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-card-foreground mb-3">Conversion Path</h4>
              <div className="flex items-center gap-2 text-sm mb-3">
                {path.path.map((asset, i) => (
                  <React.Fragment key={i}>
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {formatAssetCode(asset.code)}
                    </div>
                    {i < path.path.length - 1 && <span className="text-muted-foreground">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium text-card-foreground mb-2">Fee Breakdown</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee:</span>
                  <span className="text-card-foreground">0.00001 XLM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Intermediary Spread:</span>
                  <span className="text-card-foreground">{path.totalFeePercent.toFixed(2)}%</span>
                </div>
                <div className="border-t border-border pt-1 mt-1 flex justify-between font-medium">
                  <span className="text-card-foreground">Total Fee:</span>
                  <span className="text-card-foreground">
                    ~{formatAmount(
                      (parseFloat(path.sourceAmount) * path.totalFeePercent) / 100,
                      7
                    )} {quote.source.code}
                  </span>
                </div>
              </div>
            </div>

            {/* Liquidity & Delivery */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground text-xs mb-1">Liquidity Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${path.liquidity_score}%` }}
                    />
                  </div>
                  <p className="font-medium">{path.liquidity_score}%</p>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground text-xs mb-1">Est. Delivery Time</p>
                <p className="font-medium">{Math.round(path.executionTime / 1000)}s</p>
              </div>
            </div>

            {/* Select Button */}
            <Button
              onClick={() => onPathSelected(path)}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? 'Processing...' : 'Select This Path'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-card rounded-lg border border-border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          Available Routes
        </h3>
        <p className="text-sm text-muted-foreground">
          Showing {quote.alternativePaths.length + 1} conversion path
          {quote.alternativePaths.length + 1 !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Optimal Path */}
      {renderPath(quote.optimalPath, 0)}

      {/* Alternative Paths */}
      {quote.alternativePaths.map((path, index) => renderPath(path, index + 1))}

      {/* Quote Expiration Info */}
      <div className="mt-6 p-3 bg-accent/10 border border-accent/20 rounded-lg text-xs text-accent">
        Quote valid for {quote.expiresIn} seconds. Refresh page for new rates.
      </div>
    </div>
  );
};

export default QuoteDisplay;
