'use client';

import React from 'react';

export default function RoutesPage() {
  const routes = [
    { from: 'XLM', to: 'USD', path: 'XLM → USDC → USD', rate: 0.42, lastUsed: 'Today' },
    { from: 'XLM', to: 'EUR', path: 'XLM → EUR → USD', rate: 0.38, lastUsed: 'Yesterday' },
    { from: 'USDC', to: 'GBP', path: 'USDC → GBP', rate: 0.79, lastUsed: '2 days ago' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Saved Routes</h1>
        <p className="text-muted-foreground">
          Quick access to your frequently used payment routes
        </p>
      </div>

      <div className="grid gap-4">
        {routes.map((route, idx) => (
          <div
            key={idx}
            className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground mb-1">
                  {route.from} → {route.to}
                </p>
                <p className="text-xs text-muted-foreground">{route.path}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{route.rate}</p>
                <p className="text-xs text-muted-foreground">{route.lastUsed}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
