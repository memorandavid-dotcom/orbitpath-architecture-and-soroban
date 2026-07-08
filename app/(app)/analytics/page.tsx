'use client';

import React from 'react';

export default function AnalyticsPage() {
  const stats = [
    { label: 'Total Volume', value: '$12,456.89', change: '+24%', icon: '💵' },
    { label: 'Transactions', value: '24', change: '+12%', icon: '✈️' },
    { label: 'Total Saved', value: '$1,234.56', change: '+8%', icon: '💰' },
    { label: 'Avg Savings Rate', value: '9.9%', change: '+2%', icon: '📈' },
  ];

  const monthlyData = [
    { month: 'Jan', volume: 2500, saved: 125 },
    { month: 'Feb', volume: 3200, saved: 158 },
    { month: 'Mar', volume: 2800, saved: 142 },
    { month: 'Apr', volume: 4100, saved: 205 },
  ];

  const topAssets = [
    { asset: 'XLM', volume: '$5,234', txns: 12 },
    { asset: 'USDC', volume: '$3,456', txns: 8 },
    { asset: 'USD', volume: '$2,100', txns: 3 },
    { asset: 'EUR', volume: '$1,666', txns: 1 },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">Track your payment statistics and savings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-muted-foreground font-medium">{stat.label}</h3>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold text-foreground mb-2">{stat.value}</div>
            <p className="text-xs font-semibold text-accent">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">Monthly Volume</h2>
          <div className="space-y-4">
            {monthlyData.map((data, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{data.month}</span>
                  <span className="text-sm text-muted-foreground">${data.volume}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(data.volume / 4100) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Savings Breakdown */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">Savings Breakdown</h2>
          <div className="space-y-4">
            {monthlyData.map((data, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="font-medium text-foreground">{data.month}</span>
                <span className="font-bold text-accent">${data.saved}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Assets */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-bold text-foreground mb-6">Top Assets</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">
                  Asset
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">
                  Volume
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">
                  Transactions
                </th>
              </tr>
            </thead>
            <tbody>
              {topAssets.map((asset, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-secondary/50 transition">
                  <td className="px-4 py-3 font-semibold text-foreground">{asset.asset}</td>
                  <td className="text-right px-4 py-3 text-foreground">{asset.volume}</td>
                  <td className="text-right px-4 py-3 text-foreground">{asset.txns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
