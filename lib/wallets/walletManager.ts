/**
 * OrbitPath Wallet Manager
 * 
 * Unified interface for connecting to and managing Stellar wallets
 * Supports: Freighter, Albedo, and custom wallet implementations
 */

import { Transaction } from "@stellar/stellar-sdk";

// ============================================================================
// TYPES
// ============================================================================

export type WalletType = "freighter" | "albedo" | "custom";

export interface WalletConnection {
  type: WalletType;
  publicKey: string;
  displayName: string;
  isConnected: boolean;
}

export interface SigningResult {
  signedXDR: string;
  publicKey: string;
  signature: string;
}

export interface AuthRequest {
  challenge: string;
  timeout: number;
}

export interface AuthResponse {
  signedChallenge: string;
  publicKey: string;
}

// ============================================================================
// ABSTRACT BASE: WalletAdapter
// ============================================================================

export abstract class WalletAdapter {
  abstract type: WalletType;
  abstract connect(): Promise<WalletConnection>;
  abstract disconnect(): Promise<void>;
  abstract getPublicKey(): Promise<string>;
  abstract isInstalled(): boolean;
  abstract signTransaction(transaction: Transaction): Promise<SigningResult>;
  abstract signMessage(message: string): Promise<SigningResult>;
  abstract isConnected(): boolean;
}

// ============================================================================
// FREIGHTER WALLET ADAPTER
// ============================================================================

export class FreighterAdapter extends WalletAdapter {
  type: WalletType = "freighter";
  private publicKey: string | null = null;

  isInstalled(): boolean {
    return typeof (window as any).freighter !== "undefined";
  }

  async connect(): Promise<WalletConnection> {
    if (!this.isInstalled()) {
      throw new Error(
        "Freighter wallet not installed. Install from: https://www.freighter.app"
      );
    }

    try {
      const publicKey = await (window as any).freighter.getPublicKey();
      this.publicKey = publicKey;

      return {
        type: "freighter",
        publicKey,
        displayName: `Freighter: ${publicKey.slice(0, 8)}...`,
        isConnected: true,
      };
    } catch (error) {
      throw new Error(`Freighter connection failed: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.publicKey = null;
  }

  async getPublicKey(): Promise<string> {
    if (!this.publicKey) {
      throw new Error("Wallet not connected");
    }
    return this.publicKey;
  }

  async signTransaction(transaction: Transaction): Promise<SigningResult> {
    if (!this.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await (window as any).freighter.signTransaction(
        transaction.toXDR()
      );

      return {
        signedXDR: result,
        publicKey: this.publicKey!,
        signature: result.split(":")[1] || "", // Extract signature portion
      };
    } catch (error) {
      throw new Error(`Transaction signing failed: ${error}`);
    }
  }

  async signMessage(message: string): Promise<SigningResult> {
    if (!this.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await (window as any).freighter.signMessage(message);

      return {
        signedXDR: result,
        publicKey: this.publicKey!,
        signature: result,
      };
    } catch (error) {
      throw new Error(`Message signing failed: ${error}`);
    }
  }

  isConnected(): boolean {
    return this.publicKey !== null;
  }
}

// ============================================================================
// ALBEDO WALLET ADAPTER
// ============================================================================

export class AlbedoAdapter extends WalletAdapter {
  type: WalletType = "albedo";
  private publicKey: string | null = null;

  isInstalled(): boolean {
    // Albedo uses postMessage API, always "available"
    return true;
  }

  async connect(): Promise<WalletConnection> {
    try {
      const result = await this.sendAlbedoMessage({
        method: "public_key",
      });

      if (!result.public_key) {
        throw new Error("Failed to get public key from Albedo");
      }

      this.publicKey = result.public_key;

      return {
        type: "albedo",
        publicKey: result.public_key,
        displayName: `Albedo: ${result.public_key.slice(0, 8)}...`,
        isConnected: true,
      };
    } catch (error) {
      throw new Error(`Albedo connection failed: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.publicKey = null;
  }

  async getPublicKey(): Promise<string> {
    if (!this.publicKey) {
      throw new Error("Wallet not connected");
    }
    return this.publicKey;
  }

  async signTransaction(transaction: Transaction): Promise<SigningResult> {
    if (!this.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await this.sendAlbedoMessage({
        method: "tx_sign",
        params: {
          xdr: transaction.toXDR(),
        },
      });

      return {
        signedXDR: result.signed_envelope_xdr,
        publicKey: this.publicKey!,
        signature: result.signature || "",
      };
    } catch (error) {
      throw new Error(`Transaction signing failed: ${error}`);
    }
  }

  async signMessage(message: string): Promise<SigningResult> {
    if (!this.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await this.sendAlbedoMessage({
        method: "sign_message",
        params: {
          message: message,
          hash: false,
        },
      });

      return {
        signedXDR: result.signature,
        publicKey: this.publicKey!,
        signature: result.signature,
      };
    } catch (error) {
      throw new Error(`Message signing failed: ${error}`);
    }
  }

  isConnected(): boolean {
    return this.publicKey !== null;
  }

  private sendAlbedoMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Albedo request timeout"));
      }, 10000);

      const handler = (event: MessageEvent) => {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);

        if (event.data.type === "response") {
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data);
          }
        }
      };

      window.addEventListener("message", handler);

      window.opener?.postMessage(
        {
          ...message,
          type: "request",
        },
        "*"
      );
    });
  }
}

// ============================================================================
// WALLET MANAGER
// ============================================================================

export class WalletManager {
  private currentAdapter: WalletAdapter | null = null;
  private adapters: Map<WalletType, WalletAdapter> = new Map();

  constructor() {
    this.adapters.set("freighter", new FreighterAdapter());
    this.adapters.set("albedo", new AlbedoAdapter());
  }

  /**
   * Gets list of available wallets
   */
  getAvailableWallets(): WalletType[] {
    const available: WalletType[] = [];

    for (const [type, adapter] of this.adapters) {
      if (adapter.isInstalled()) {
        available.push(type as WalletType);
      }
    }

    // Always include custom as fallback
    if (!available.includes("custom")) {
      available.push("custom");
    }

    return available;
  }

  /**
   * Connects to specified wallet
   */
  async connect(walletType: WalletType): Promise<WalletConnection> {
    const adapter = this.adapters.get(walletType);

    if (!adapter) {
      throw new Error(`Unknown wallet type: ${walletType}`);
    }

    if (!adapter.isInstalled() && walletType !== "custom") {
      throw new Error(`${walletType} wallet not installed`);
    }

    try {
      const connection = await adapter.connect();
      this.currentAdapter = adapter;
      console.log(`[OrbitPath] Connected to ${walletType} wallet`);
      return connection;
    } catch (error) {
      throw new Error(`Failed to connect to ${walletType}: ${error}`);
    }
  }

  /**
   * Disconnects current wallet
   */
  async disconnect(): Promise<void> {
    if (this.currentAdapter) {
      await this.currentAdapter.disconnect();
      this.currentAdapter = null;
      console.log("[OrbitPath] Wallet disconnected");
    }
  }

  /**
   * Gets current connected wallet info
   */
  getCurrentWallet(): WalletConnection | null {
    if (!this.currentAdapter || !this.currentAdapter.isConnected()) {
      return null;
    }

    return {
      type: this.currentAdapter.type,
      publicKey: "",
      displayName: "",
      isConnected: true,
    };
  }

  /**
   * Signs a transaction
   */
  async signTransaction(transaction: Transaction): Promise<SigningResult> {
    if (!this.currentAdapter) {
      throw new Error("No wallet connected");
    }

    return this.currentAdapter.signTransaction(transaction);
  }

  /**
   * Signs a message
   */
  async signMessage(message: string): Promise<SigningResult> {
    if (!this.currentAdapter) {
      throw new Error("No wallet connected");
    }

    return this.currentAdapter.signMessage(message);
  }

  /**
   * Checks if wallet is connected
   */
  isConnected(): boolean {
    return this.currentAdapter?.isConnected() ?? false;
  }

  /**
   * Gets current public key
   */
  async getPublicKey(): Promise<string> {
    if (!this.currentAdapter) {
      throw new Error("No wallet connected");
    }

    return this.currentAdapter.getPublicKey();
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

let globalWalletManager: WalletManager | null = null;

export function getWalletManager(): WalletManager {
  if (!globalWalletManager) {
    globalWalletManager = new WalletManager();
  }
  return globalWalletManager;
}

export default WalletManager;
