'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { label: 'Total Transfers', value: '24', trend: '+12%', icon: '✈️' },
    { label: 'Amount Transferred', value: '$12,456.89', trend: '+24%', icon: '💵' },
    { label: 'Total Saved', value: '$1,234.56', trend: '+8%', icon: '💰' },
    { label: 'Wallets Connected', value: '3', trend: 'Active', icon: '🔗' },
  ];

  const recentTransactions = [
    {
      id: '1',
      to: 'John Doe (USD)',
      amount: '$500.00',
      saved: '+$45.12',
      status: 'Completed',
      date: 'Today',
    },
    {
      id: '2',
      to: 'Maria Garcia (EUR)',
      amount: '€420.50',
      saved: '+$38.90',
      status: 'Completed',
      date: 'Yesterday',
    },
    {
      id: '3',
      to: 'Ahmed Hassan (GBP)',
      amount: '£350.00',
      saved: '+$42.30',
      status: 'Pending',
      date: '2 days ago',
    },
  ];

  const quickActions = [
    { label: 'Send Money', href: '/send', icon: '✈️', color: 'bg-primary' },
    { label: 'View Routes', href: '/routes', icon: '🗺️', color: 'bg-accent' },
    { label: 'Manage Wallets', href: '/wallets', icon: '💰', color: 'bg-blue-500' },
    { label: 'See Analytics', href: '/analytics', icon: '📈', color: 'bg-green-500' },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground">
          Here&apos;s your OrbitPath summary. All your transfers, savings, and wallet connections at a glance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-muted-foreground font-medium">{stat.label}</h3>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold text-foreground mb-2">{stat.value}</div>
            <p className={`text-xs font-semibold ${stat.trend.includes('+') ? 'text-accent' : 'text-muted-foreground'}`}>
              {stat.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, idx) => (
          <Link
            key={idx}
            href={action.href}
            className={`${action.color} bg-opacity-10 border-2 border-opacity-20 border-current rounded-lg p-6 text-center hover:bg-opacity-20 transition cursor-pointer`}
          >
            <div className="text-4xl mb-3">{action.icon}</div>
            <div className="font-semibold text-foreground">{action.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Recent Transfers</h2>
          <Link href="/history" className="text-primary hover:underline text-sm font-medium">
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div className="flex-1">
                <p className="font-semibold text-foreground">{tx.to}</p>
                <p className="text-xs text-muted-foreground">{tx.date}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{tx.amount}</p>
                <p className="text-xs text-accent">Saved {tx.saved}</p>
              </div>
              <div className="ml-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    tx.status === 'Completed'
                      ? 'bg-green-500/20 text-green-600'
                      : 'bg-yellow-500/20 text-yellow-600'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary mb-2">Tip: Connect Multiple Wallets</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Connect Freighter, Albedo, or other Stellar wallets to get the best exchange rates and routes across multiple sources.
        </p>
        <Link href="/wallets" className="text-primary hover:underline font-medium text-sm">
          Manage Wallets →
        </Link>
      </div>
    </div>
  );
}
