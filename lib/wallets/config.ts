/**
 * OrbitPath Wallet Configuration
 * 
 * Centralized configuration for all wallet adapters
 * Enable/disable wallets, set timeouts, and manage feature flags
 */

import { WalletType } from './walletManager';

export interface WalletMetadata {
  name: string;
  description: string;
  icon?: string;
  enabled: boolean;
  timeout: number; // milliseconds
  retryAttempts: number;
  priority: number; // Higher = preferred first
  requiresExtension?: boolean;
  supportsOfflineMode?: boolean;
  supportedNetworks?: string[]; // e.g., ['testnet', 'mainnet']
}

export type WalletConfig = {
  [key in WalletType]: WalletMetadata;
};

export const DEFAULT_WALLET_CONFIG: WalletConfig = {
  freighter: {
    name: 'Freighter',
    description: 'Browser extension wallet for Stellar',
    icon: '🔐',
    enabled: true,
    timeout: 5000,
    retryAttempts: 2,
    priority: 1,
    requiresExtension: true,
    supportedNetworks: ['testnet', 'mainnet', 'futurenet'],
  },
  albedo: {
    name: 'Albedo',
    description: 'Web-based secure signing for Stellar',
    icon: '🌐',
    enabled: true,
    timeout: 3000,
    retryAttempts: 1,
    priority: 2,
    requiresExtension: false,
    supportedNetworks: ['testnet', 'mainnet'],
  },
  custom: {
    name: 'Manual Entry',
    description: 'Enter your public key directly',
    icon: '📝',
    enabled: true,
    timeout: 1000,
    retryAttempts: 0,
    priority: 3,
    requiresExtension: false,
    supportsOfflineMode: true,
    supportedNetworks: ['testnet', 'mainnet', 'futurenet'],
  },
};

class WalletConfigManager {
  private config: WalletConfig;
  private readonly STORAGE_KEY = 'orbitpath_wallet_config';

  constructor() {
    this.config = { ...DEFAULT_WALLET_CONFIG };
    this.loadFromStorage();
  }

  /**
   * Get full wallet configuration
   */
  getConfig(): WalletConfig {
    return { ...this.config };
  }

  /**
   * Get metadata for a specific wallet
   */
  getWalletMetadata(walletType: WalletType): WalletMetadata {
    return { ...this.config[walletType] };
  }

  /**
   * Check if a wallet is enabled
   */
  isWalletEnabled(walletType: WalletType): boolean {
    return this.config[walletType]?.enabled ?? false;
  }

  /**
   * Get enabled wallets sorted by priority
   */
  getEnabledWallets(): Array<{ type: WalletType; metadata: WalletMetadata }> {
    return Object.entries(this.config)
      .filter(([_, metadata]) => metadata.enabled)
      .map(([type, metadata]) => ({ type: type as WalletType, metadata }))
      .sort((a, b) => a.metadata.priority - b.metadata.priority);
  }

  /**
   * Update wallet metadata
   */
  updateWallet(walletType: WalletType, updates: Partial<WalletMetadata>): void {
    if (this.config[walletType]) {
      this.config[walletType] = { ...this.config[walletType], ...updates };
      this.saveToStorage();
    }
  }

  /**
   * Enable a wallet
   */
  enableWallet(walletType: WalletType): void {
    this.updateWallet(walletType, { enabled: true });
  }

  /**
   * Disable a wallet
   */
  disableWallet(walletType: WalletType): void {
    this.updateWallet(walletType, { enabled: false });
  }

  /**
   * Set timeout for a wallet
   */
  setWalletTimeout(walletType: WalletType, timeout: number): void {
    this.updateWallet(walletType, { timeout });
  }

  /**
   * Get timeout for a wallet
   */
  getWalletTimeout(walletType: WalletType): number {
    return this.config[walletType]?.timeout ?? 5000;
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.config = { ...DEFAULT_WALLET_CONFIG };
    this.saveToStorage();
  }

  /**
   * Save configuration to localStorage
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
      } catch (e) {
        console.warn('[OrbitPath] Failed to save wallet config to storage');
      }
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Merge with defaults to ensure all keys exist
          this.config = { ...DEFAULT_WALLET_CONFIG, ...parsed };
        }
      } catch (e) {
        console.warn('[OrbitPath] Failed to load wallet config from storage');
      }
    }
  }

  /**
   * Export configuration as JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfig(jsonString: string): void {
    try {
      const parsed = JSON.parse(jsonString);
      this.config = { ...DEFAULT_WALLET_CONFIG, ...parsed };
      this.saveToStorage();
    } catch (e) {
      throw new Error(`Failed to import wallet config: ${e}`);
    }
  }
}

// Create singleton instance
export const walletConfigManager = new WalletConfigManager();
