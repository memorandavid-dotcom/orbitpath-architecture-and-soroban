'use client';

import React from 'react';

export default function HistoryPage() {
  const transactions = [
    {
      id: 1,
      to: 'John Doe',
      amount: '$500.00',
      asset: 'USD',
      status: 'Completed',
      date: 'Today',
      saved: '+$45.12',
      txHash: 'abc123def456',
    },
    {
      id: 2,
      to: 'Maria Garcia',
      amount: '€420.50',
      asset: 'EUR',
      status: 'Completed',
      date: 'Yesterday',
      saved: '+$38.90',
      txHash: 'xyz789uvw012',
    },
    {
      id: 3,
      to: 'Ahmed Hassan',
      amount: '£350.00',
      asset: 'GBP',
      status: 'Pending',
      date: '2 days ago',
      saved: '+$42.30',
      txHash: 'pqr345stu678',
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Transaction History</h1>
        <p className="text-muted-foreground">
          View all your past payments and transfers
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                Recipient
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                Amount
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                Date
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                Status
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                Saved
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-border hover:bg-secondary/30 transition">
                <td className="px-6 py-4">
                  <p className="font-semibold text-foreground">{tx.to}</p>
                </td>
                <td className="px-6 py-4 font-semibold text-foreground">{tx.amount}</td>
                <td className="px-6 py-4 text-muted-foreground">{tx.date}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      tx.status === 'Completed'
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-yellow-500/20 text-yellow-600'
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-accent font-semibold">{tx.saved}</td>
                <td className="px-6 py-4">
                  <button className="text-primary hover:underline text-sm font-medium">
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
