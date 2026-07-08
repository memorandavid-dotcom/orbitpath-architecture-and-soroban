'use client';

import React, { useState, useEffect } from 'react';
import { walletConfigManager, type WalletMetadata } from '@/lib/wallets/config';
import { walletLogger, type WalletLog } from '@/lib/wallets/logger';
import { getWalletManager, type WalletType } from '@/lib/wallets/walletManager';
import { Settings, Download, Upload, Trash2, AlertCircle } from 'lucide-react';

export const WalletManagementDashboard: React.FC = () => {
  const [config, setConfig] = useState(walletConfigManager.getConfig());
  const [logs, setLogs] = useState<WalletLog[]>(walletLogger.getLogs());
  const [activeTab, setActiveTab] = useState<'config' | 'logs' | 'health'>('config');
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setConfig(walletConfigManager.getConfig());
      setLogs(walletLogger.getLogs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const walletManager = getWalletManager();
  const available = walletManager.getAvailableWallets();

  // Calculate health metrics
  const errorLogs = logs.filter((l) => l.level === 'error');
  const warningLogs = logs.filter((l) => l.level === 'warning');
  const connectionAttempts = logs.filter((l) => l.operation === 'Connect');
  const connectionSuccesses = connectionAttempts.filter((l) => l.level === 'success');
  const successRate =
    connectionAttempts.length > 0
      ? ((connectionSuccesses.length / connectionAttempts.length) * 100).toFixed(1)
      : 0;

  const handleToggleWallet = (walletType: WalletType) => {
    const metadata = walletConfigManager.getWalletMetadata(walletType);
    if (metadata.enabled) {
      walletConfigManager.disableWallet(walletType);
    } else {
      walletConfigManager.enableWallet(walletType);
    }
    setConfig(walletConfigManager.getConfig());
  };

  const handleUpdateTimeout = (walletType: WalletType, timeout: number) => {
    walletConfigManager.setWalletTimeout(walletType, timeout);
    setConfig(walletConfigManager.getConfig());
  };

  const handleExportConfig = () => {
    const configJson = walletConfigManager.exportConfig();
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleExportLogs = () => {
    const logsJson = walletLogger.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Wallet Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure, monitor, and manage wallet adapters
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {['config', 'logs', 'health'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            {/* Available Wallets */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Available Wallets</h2>
              <div className="grid gap-3">
                {Object.entries(config).map(([walletType, metadata]) => (
                  <div
                    key={walletType}
                    className="p-4 border border-border rounded-lg space-y-3 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{metadata.name}</h3>
                        <p className="text-sm text-muted-foreground">{metadata.description}</p>
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          <div>Type: {walletType}</div>
                          <div>Priority: {metadata.priority}</div>
                          {metadata.requiresExtension && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <AlertCircle className="w-3 h-3" />
                              Requires Extension
                            </div>
                          )}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={metadata.enabled}
                          onChange={() => handleToggleWallet(walletType as WalletType)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm font-medium">
                          {metadata.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>

                    {/* Timeout Settings */}
                    <div className="bg-secondary/30 p-3 rounded space-y-2">
                      <label className="text-sm font-medium block">
                        Connection Timeout: {metadata.timeout}ms
                      </label>
                      <input
                        type="range"
                        min="1000"
                        max="15000"
                        step="500"
                        value={metadata.timeout}
                        onChange={(e) =>
                          handleUpdateTimeout(walletType as WalletType, parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground">
                        Retry Attempts: {metadata.retryAttempts}
                      </div>
                    </div>

                    {/* Supported Networks */}
                    {metadata.supportedNetworks && (
                      <div className="text-xs">
                        <span className="font-medium">Networks:</span>{' '}
                        <span className="text-muted-foreground">
                          {metadata.supportedNetworks.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Export/Import */}
            <div className="bg-secondary/20 p-4 rounded-lg space-y-3 border border-border">
              <h3 className="font-semibold">Configuration Management</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExportConfig}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Config
                </button>
                <button
                  onClick={() => walletConfigManager.resetToDefaults()}
                  className="flex items-center gap-2 px-3 py-2 bg-destructive/20 border border-destructive/30 rounded hover:bg-destructive/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset Defaults
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex gap-2 items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Total Logs: {logs.length} | Errors: {errorLogs.length} | Warnings:{' '}
                {warningLogs.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportLogs}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                >
                  <Download className="w-4 h-4" />
                  Export Logs
                </button>
                <button
                  onClick={() => {
                    walletLogger.clearLogs();
                    setLogs([]);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-destructive/20 border border-destructive/30 rounded text-sm hover:bg-destructive/30"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>

            {/* Recent Logs */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No logs recorded</div>
              ) : (
                logs
                  .slice()
                  .reverse()
                  .slice(0, 50)
                  .map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded border-l-2 font-mono text-xs space-y-1 ${
                        log.level === 'error'
                          ? 'border-red-500/50 bg-red-500/5'
                          : log.level === 'warning'
                          ? 'border-yellow-500/50 bg-yellow-500/5'
                          : log.level === 'success'
                          ? 'border-green-500/50 bg-green-500/5'
                          : 'border-blue-500/50 bg-blue-500/5'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="font-bold uppercase text-xs">{log.level}</span>
                        <span className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div>{log.operation}: {log.message}</div>
                      {log.wallet && <div className="text-muted-foreground">Wallet: {log.wallet}</div>}
                      {log.error && <div className="text-destructive">Error: {log.error}</div>}
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div className="grid gap-4">
            {/* Health Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border border-border rounded-lg bg-secondary/20">
                <div className="text-sm text-muted-foreground">Connection Success Rate</div>
                <div className="text-2xl font-bold mt-2">{successRate}%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {connectionSuccesses.length}/{connectionAttempts.length} attempts
                </div>
              </div>
              <div className="p-4 border border-border rounded-lg bg-secondary/20">
                <div className="text-sm text-muted-foreground">Total Errors</div>
                <div className="text-2xl font-bold mt-2 text-destructive">{errorLogs.length}</div>
              </div>
              <div className="p-4 border border-border rounded-lg bg-secondary/20">
                <div className="text-sm text-muted-foreground">Warnings</div>
                <div className="text-2xl font-bold mt-2 text-yellow-600">{warningLogs.length}</div>
              </div>
              <div className="p-4 border border-border rounded-lg bg-secondary/20">
                <div className="text-sm text-muted-foreground">Enabled Wallets</div>
                <div className="text-2xl font-bold mt-2">
                  {Object.values(config).filter((m) => m.enabled).length}
                </div>
              </div>
            </div>

            {/* Wallet Status */}
            <div className="space-y-3">
              <h3 className="font-semibold">Wallet Status</h3>
              <div className="grid gap-3">
                {available.map((walletType) => {
                  const walletLogs = logs.filter((l) => l.wallet === walletType);
                  const walletErrors = walletLogs.filter((l) => l.level === 'error');
                  return (
                    <div key={walletType} className="p-3 border border-border rounded bg-secondary/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium capitalize">{walletType}</div>
                          <div className="text-xs text-muted-foreground">
                            Operations: {walletLogs.length} | Errors: {walletErrors.length}
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            walletErrors.length === 0
                              ? 'bg-green-500/20 text-green-700'
                              : 'bg-red-500/20 text-red-700'
                          }`}
                        >
                          {walletErrors.length === 0 ? 'Healthy' : 'Issues'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletManagementDashboard;
