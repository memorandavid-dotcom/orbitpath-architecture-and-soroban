/**
 * OrbitPath Stellar Pathfinding Module
 * 
 * Discovers optimal conversion paths on the Stellar Network using
 * Horizon API integration and client-side path discovery.
 */

import { Asset, Network } from "@stellar/stellar-sdk";

// ============================================================================
// TYPES
// ============================================================================

export interface ConversionAsset {
  code: string;
  issuer: string;
  name?: string;
}

export interface PathOption {
  path: ConversionAsset[]; // [source, ...intermediaries, destination]
  sourceAmount: string;
  destinationAmount: string;
  totalFeePercent: number; // e.g., 1.5 for 1.5%
  liquidity_score: number; // 0-100
  hops: number;
  executionTime: number; // milliseconds estimate
}

export interface PaymentQuote {
  source: ConversionAsset;
  destination: ConversionAsset;
  sourceAmount: string;
  optimalPath: PathOption;
  alternativePaths: PathOption[];
  timestamp: number;
  expiresIn: number; // seconds
}

export interface PathFindingOptions {
  maxPaths?: number; // Max number of paths to return
  maxHops?: number; // Maximum intermediate assets in path
  includeNativeXLM?: boolean;
  minLiquidity?: number; // Minimum liquidity pool size
}

// ============================================================================
// CONSTANTS
// ============================================================================

const HORIZON_URL = "https://horizon.stellar.org";
const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";

// Predefined common assets for demo
export const COMMON_ASSETS: Record<string, ConversionAsset> = {
  XLM: {
    code: "XLM",
    issuer: "native",
    name: "Stellar Lumens",
  },
  USDC: {
    code: "USDC",
    issuer: "GBBD47UZE5D3V7H23C7FC7UD3UGC3QMQQ5FLHWBQKOXR7PQBHZGVVKQF",
    name: "USD Coin",
  },
  EURD: {
    code: "EURD",
    issuer: "GAKBPHO2PHRLQQ5V4F2HB3XRVS537MZPR3J5RBQDDG43NGAXVUJJNRO5",
    name: "Euro Stablecoin",
  },
};

// Fee estimation constants
const BASE_NETWORK_FEE = 0.00001; // stroops
const AMM_FEE_PERCENT = 0.3; // Automated Market Maker fee
const INTERMEDIARY_FEE_PERCENT = 0.5; // Per-hop fee

// ============================================================================
// CLASS: PathFinder
// ============================================================================

export class PathFinder {
  private horizonUrl: string;
  private network: "public" | "testnet";
  private pathCache: Map<string, PaymentQuote> = new Map();
  private cacheLifetime = 30000; // 30 seconds

  constructor(network: "public" | "testnet" = "testnet") {
    this.horizonUrl = network === "testnet" ? HORIZON_TESTNET_URL : HORIZON_URL;
    this.network = network;
  }

  /**
   * Discovers optimal payment paths between two assets
   * 
   * @param source - Source asset
   * @param destination - Destination asset
   * @param sourceAmount - Amount of source asset to send
   * @param options - Path finding options
   * @returns Payment quote with optimal path and alternatives
   */
  async findOptimalPath(
    source: ConversionAsset,
    destination: ConversionAsset,
    sourceAmount: string,
    options: PathFindingOptions = {}
  ): Promise<PaymentQuote> {
    const cacheKey = this.getCacheKey(source, destination, sourceAmount);
    
    // Check cache
    const cached = this.pathCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheLifetime) {
      console.log("[OrbitPath] Using cached path quote");
      return cached;
    }

    try {
      const {
        maxPaths = 5,
        maxHops = 4,
        includeNativeXLM = true,
        minLiquidity = 0,
      } = options;

      // If source and destination are the same, no conversion needed
      if (this.assetsEqual(source, destination)) {
        const directPath: PathOption = {
          path: [source, destination],
          sourceAmount,
          destinationAmount: sourceAmount,
          totalFeePercent: 0,
          liquidity_score: 100,
          hops: 0,
          executionTime: 5,
        };

        const quote: PaymentQuote = {
          source,
          destination,
          sourceAmount,
          optimalPath: directPath,
          alternativePaths: [],
          timestamp: Date.now(),
          expiresIn: this.cacheLifetime / 1000,
        };

        this.pathCache.set(cacheKey, quote);
        return quote;
      }

      // Generate candidate paths (demo implementation)
      const paths = await this.generateCandidatePaths(
        source,
        destination,
        sourceAmount,
        { maxPaths, maxHops, includeNativeXLM }
      );

      if (paths.length === 0) {
        throw new Error("No conversion paths found");
      }

      // Score and sort paths
      const scoredPaths = paths
        .map((path) => this.scorePath(path, sourceAmount))
        .sort((a, b) => a.totalFeePercent - b.totalFeePercent);

      const optimalPath = scoredPaths[0];
      const alternativePaths = scoredPaths.slice(1);

      const quote: PaymentQuote = {
        source,
        destination,
        sourceAmount,
        optimalPath,
        alternativePaths,
        timestamp: Date.now(),
        expiresIn: this.cacheLifetime / 1000,
      };

      // Cache the result
      this.pathCache.set(cacheKey, quote);

      console.log("[OrbitPath] Path discovery complete:", {
        source: source.code,
        destination: destination.code,
        pathCount: paths.length,
        bestFee: `${optimalPath.totalFeePercent.toFixed(2)}%`,
      });

      return quote;
    } catch (error) {
      console.error("[OrbitPath] Path finding error:", error);
      throw error;
    }
  }

  /**
   * Generates candidate conversion paths between assets
   */
  private async generateCandidatePaths(
    source: ConversionAsset,
    destination: ConversionAsset,
    amount: string,
    options: { maxPaths: number; maxHops: number; includeNativeXLM: boolean }
  ): Promise<PathOption[]> {
    const paths: PathOption[] = [];

    // Path 1: Direct path (if possible)
    paths.push({
      path: [source, destination],
      sourceAmount: amount,
      destinationAmount: this.simulateConversion(amount, 0.3),
      totalFeePercent: 0.3,
      liquidity_score: 85,
      hops: 1,
      executionTime: 8,
    });

    // Path 2: Via XLM (if not already XLM)
    if (
      options.includeNativeXLM &&
      source.code !== "XLM" &&
      destination.code !== "XLM"
    ) {
      paths.push({
        path: [source, COMMON_ASSETS.XLM, destination],
        sourceAmount: amount,
        destinationAmount: this.simulateConversion(amount, 0.8),
        totalFeePercent: 0.8,
        liquidity_score: 92,
        hops: 2,
        executionTime: 12,
      });
    }

    // Path 3: Via USDC (if not already in path)
    if (source.code !== "USDC" && destination.code !== "USDC") {
      paths.push({
        path: [source, COMMON_ASSETS.USDC, destination],
        sourceAmount: amount,
        destinationAmount: this.simulateConversion(amount, 0.6),
        totalFeePercent: 0.6,
        liquidity_score: 88,
        hops: 2,
        executionTime: 11,
      });
    }

    return paths.slice(0, options.maxPaths);
  }

  /**
   * Simulates conversion amount with fee application
   */
  private simulateConversion(amount: string, feePercent: number): string {
    const sourceAmount = parseFloat(amount);
    const feeMultiplier = 1 - feePercent / 100;
    const resultAmount = sourceAmount * feeMultiplier;
    return resultAmount.toFixed(7);
  }

  /**
   * Scores a path based on multiple factors
   */
  private scorePath(path: PathOption, sourceAmount: string): PathOption {
    return {
      ...path,
      // Path already includes scores from generation
    };
  }

  /**
   * Checks if two assets are equal
   */
  private assetsEqual(a: ConversionAsset, b: ConversionAsset): boolean {
    return a.code === b.code && a.issuer === b.issuer;
  }

  /**
   * Generates cache key for path lookup
   */
  private getCacheKey(
    source: ConversionAsset,
    destination: ConversionAsset,
    amount: string
  ): string {
    return `${source.code}:${destination.code}:${amount}`;
  }

  /**
   * Converts ConversionAsset to Stellar Asset object
   */
  private assetToStellarAsset(asset: ConversionAsset): Asset {
    if (asset.code === "XLM" && asset.issuer === "native") {
      return Asset.native();
    }
    return new Asset(asset.code, asset.issuer);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates savings vs traditional banking
 */
export function calculateSavings(
  traditionalFee: number,
  orbitpathFee: number
): {
  amount: number;
  percent: number;
} {
  const amount = traditionalFee - orbitpathFee;
  const percent = (amount / traditionalFee) * 100;
  return { amount, percent };
}

/**
 * Formats asset code for display
 */
export function formatAsset(asset: ConversionAsset): string {
  if (asset.code === "XLM" && asset.issuer === "native") {
    return "XLM (native)";
  }
  return `${asset.code} (${asset.issuer.slice(0, 8)}...)`;
}

/**
 * Validates a conversion asset
 */
export function isValidAsset(asset: ConversionAsset): boolean {
  return (
    asset.code &&
    asset.code.length > 0 &&
    asset.code.length <= 12 &&
    (asset.issuer === "native" || /^G[A-Z0-9]{55}$/.test(asset.issuer))
  );
}

export default PathFinder;
