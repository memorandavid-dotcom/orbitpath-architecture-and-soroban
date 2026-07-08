'use client';

import React, { useState, useEffect } from 'react';
import { walletLogger, type WalletLog } from '@/lib/wallets/logger';
import { walletConfigManager } from '@/lib/wallets/config';
import { X, ChevronDown, Download, Trash2 } from 'lucide-react';

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<WalletLog[]>([]);
  const [selectedTab, setSelectedTab] = useState<'logs' | 'config' | 'status'>('logs');
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  // Only show debug panel in development
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isDev) return;

    // Update logs every 500ms
    const interval = setInterval(() => {
      setLogs(walletLogger.getLogs());
    }, 500);

    return () => clearInterval(interval);
  }, [isDev]);

  // Listen for Ctrl+D to toggle panel
  useEffect(() => {
    if (!isDev) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDev]);

  if (!isDev) return null;

  const filteredLogs = filterLevel
    ? logs.filter((log) => log.level === filterLevel)
    : logs;

  const enabledWallets = walletConfigManager.getEnabledWallets();

  return (
    <div className="fixed bottom-0 right-0 z-40">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="m-4 px-3 py-2 bg-primary text-primary-foreground rounded text-xs font-mono hover:bg-primary/90 transition-colors"
          title="Press Ctrl+D to toggle debug panel"
        >
          Debug
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="bg-card border-t border-l border-border rounded-tl-lg shadow-lg max-h-96 w-96 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/20">
            <div className="text-xs font-bold text-foreground">OrbitPath Debug Panel</div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-border rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-3 pt-2 border-b border-border">
            {['logs', 'config', 'status'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as any)}
                className={`px-2 py-1 text-xs rounded transition-colors capitalize ${
                  selectedTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2">
            {selectedTab === 'logs' && (
              <>
                <div className="flex gap-2 mb-2">
                  <select
                    value={filterLevel || ''}
                    onChange={(e) => setFilterLevel(e.target.value || null)}
                    className="px-2 py-1 bg-background border border-border rounded text-xs"
                  >
                    <option value="">All Levels</option>
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                  <button
                    onClick={() => {
                      walletLogger.clearLogs();
                      setLogs([]);
                    }}
                    className="px-2 py-1 bg-destructive/20 border border-destructive/30 rounded text-xs hover:bg-destructive/30 transition-colors flex gap-1 items-center"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>

                <div className="space-y-1">
                  {filteredLogs.length === 0 ? (
                    <div className="text-muted-foreground">No logs</div>
                  ) : (
                    filteredLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-1 rounded border-l-2 ${
                          log.level === 'error'
                            ? 'border-red-500/50 bg-red-500/5'
                            : log.level === 'warning'
                            ? 'border-yellow-500/50 bg-yellow-500/5'
                            : log.level === 'success'
                            ? 'border-green-500/50 bg-green-500/5'
                            : 'border-blue-500/50 bg-blue-500/5'
                        }`}
                      >
                        <div className="text-muted-foreground">
                          [{new Date(log.timestamp).toLocaleTimeString()}]{' '}
                          <span className="capitalize font-bold">{log.level}</span>
                        </div>
                        <div className="text-foreground">{log.operation}: {log.message}</div>
                        {log.wallet && (
                          <div className="text-muted-foreground text-xs">Wallet: {log.wallet}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {selectedTab === 'config' && (
              <>
                <div className="text-accent font-bold mb-2">Wallet Configuration</div>
                {enabledWallets.map((wallet) => (
                  <div key={wallet.type} className="bg-background p-2 rounded border border-border">
                    <div className="font-bold text-foreground">{wallet.metadata.name}</div>
                    <div className="text-muted-foreground text-xs">
                      Type: {wallet.type}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Timeout: {wallet.metadata.timeout}ms
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Priority: {wallet.metadata.priority}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const config = walletConfigManager.exportConfig();
                    const blob = new Blob([config], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'wallet-config.json';
                    a.click();
                  }}
                  className="mt-2 px-2 py-1 bg-primary/20 border border-primary/30 rounded text-xs hover:bg-primary/30 transition-colors flex gap-1 items-center w-full justify-center"
                >
                  <Download className="w-3 h-3" /> Export Config
                </button>
              </>
            )}

            {selectedTab === 'status' && (
              <>
                <div className="text-accent font-bold mb-2">System Status</div>
                <div className="bg-background p-2 rounded border border-border space-y-1">
                  <div>
                    <span className="text-muted-foreground">Environment:</span>{' '}
                    <span className="text-foreground">{process.env.NODE_ENV}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Logs:</span>{' '}
                    <span className="text-foreground">{logs.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Error Logs:</span>{' '}
                    <span className="text-destructive font-bold">
                      {logs.filter((l) => l.level === 'error').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Enabled Wallets:</span>{' '}
                    <span className="text-foreground">{enabledWallets.length}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="text-xs text-muted-foreground px-3 py-2 border-t border-border bg-secondary/10">
            Press Ctrl+D to toggle
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
