'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    theme: 'auto',
    notifications: true,
    autoRoute: true,
    maxSlippage: '0.5',
    defaultAsset: 'XLM',
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
    toast.success('Setting updated');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">Manage your account and preferences</p>

      {/* Account Section */}
      <div className="bg-card border border-border rounded-lg p-8 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-6">Account</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground disabled:opacity-50"
            />
          </div>

          <button className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-2 px-4 rounded-lg transition mt-4">
            Change Password
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-card border border-border rounded-lg p-8 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-6">Preferences</h2>

        <div className="space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="auto">Auto (System)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Email Notifications
              </label>
              <p className="text-xs text-muted-foreground">
                Get notified about payment status updates
              </p>
            </div>
            <button
              onClick={() =>
                handleSettingChange('notifications', !settings.notifications)
              }
              className={`relative inline-block h-8 w-14 rounded-full transition ${
                settings.notifications ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition ${
                  settings.notifications ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Auto Route */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Auto-Select Best Route
              </label>
              <p className="text-xs text-muted-foreground">
                Automatically use the route with lowest fees
              </p>
            </div>
            <button
              onClick={() =>
                handleSettingChange('autoRoute', !settings.autoRoute)
              }
              className={`relative inline-block h-8 w-14 rounded-full transition ${
                settings.autoRoute ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition ${
                  settings.autoRoute ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Max Slippage */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Max Slippage Tolerance
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={settings.maxSlippage}
                onChange={(e) => handleSettingChange('maxSlippage', e.target.value)}
                className="flex-1"
              />
              <input
                type="number"
                value={settings.maxSlippage}
                onChange={(e) => handleSettingChange('maxSlippage', e.target.value)}
                className="w-20 px-2 py-1 bg-background border border-border rounded text-foreground text-right"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          {/* Default Asset */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Default Asset
            </label>
            <select
              value={settings.defaultAsset}
              onChange={(e) => handleSettingChange('defaultAsset', e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="XLM">Stellar Lumen (XLM)</option>
              <option value="USDC">USDC</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-card border border-border rounded-lg p-8 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-6">Security</h2>

        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition font-medium">
            Two-Factor Authentication
          </button>
          <button className="w-full text-left px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition font-medium">
            Active Sessions
          </button>
          <button className="w-full text-left px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition font-medium">
            Login History
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8">
        <h2 className="text-xl font-bold text-destructive mb-6">Danger Zone</h2>

        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive font-semibold rounded-lg transition"
          >
            Sign Out
          </button>
          <button className="w-full px-4 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive font-semibold rounded-lg transition">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
