/**
 * OrbitPath Stellar Pathfinding Module
 * 
 * Discovers optimal conversion paths on the Stellar Network using
 * the Horizon API and local path-finding algorithms.
 */

import {
  Server,
  Asset,
  Horizon,
  Path,
  Network,
} from "@stellar/stellar-sdk";

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
// CONFIGURATION
// ============================================================================

const HORIZON_URL = "https://horizon.stellar.org";
const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";

const COMMON_ASSETS: Record<string, ConversionAsset> = {
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
  private server: Server;
  private network: "public" | "testnet";
  private pathCache: Map<string, PaymentQuote> = new Map();
  private cacheLifetime = 30000; // 30 seconds

  constructor(network: "public" | "testnet" = "public") {
    const url = network === "testnet" ? HORIZON_TESTNET_URL : HORIZON_URL;
    this.server = new Server(url);
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

      // Query Horizon for available paths
      const paths = await this.server.strictReceivePaths(
        this.assetToStellarAsset(source),
        this.assetToStellarAsset(destination),
        sourceAmount
      ).call();

      // Convert and rank paths
      const pathOptions = paths.records
        .slice(0, maxPaths)
        .map((record) => this.recordToPathOption(record, sourceAmount))
        .sort((a, b) => {
          // Sort by fee (ascending), then by liquidity (descending)
          if (a.totalFeePercent !== b.totalFeePercent) {
            return a.totalFeePercent - b.totalFeePercent;
          }
          return b.liquidity_score - a.liquidity_score;
        });

      if (pathOptions.length === 0) {
        throw new Error(
          `No conversion paths found from ${source.code} to ${destination.code}`
        );
      }

      const optimalPath = pathOptions[0];
      const alternativePaths = pathOptions.slice(1);

      const quote: PaymentQuote = {
        source,
        destination,
        sourceAmount,
        optimalPath,
        alternativePaths,
        timestamp: Date.now(),
        expiresIn: this.cacheLifetime / 1000,
      };

      this.pathCache.set(cacheKey, quote);
      return quote;
    } catch (error) {
      console.error("[OrbitPath] Path finding error:", error);
      throw new Error(`Failed to find payment path: ${error}`);
    }
  }

  /**
   * Gets available trading pairs for an asset
   * 
   * @param asset - Asset to get pairs for
   * @returns Array of trading pair assets
   */
  async getTradingPairs(asset: ConversionAsset): Promise<ConversionAsset[]> {
    try {
      const trades = await this.server
        .trades()
        .forAsset(this.assetToStellarAsset(asset))
        .limit(50)
        .call();

      const pairs = new Set<string>();
      
      for (const trade of trades.records) {
        const counterAsset = trade.counter_asset_code || "XLM";
        const counterIssuer = trade.counter_asset_issuer || "native";
        pairs.add(`${counterAsset}:${counterIssuer}`);
      }

      return Array.from(pairs).map((pair) => {
        const [code, issuer] = pair.split(":");
        return { code, issuer };
      });
    } catch (error) {
      console.error("[OrbitPath] Failed to get trading pairs:", error);
      return [];
    }
  }

  /**
   * Gets real-time liquidity information for a pair
   * 
   * @param base - Base asset
   * @param counter - Counter asset
   * @returns Liquidity metrics including depth and spread
   */
  async getLiquidityMetrics(
    base: ConversionAsset,
    counter: ConversionAsset
  ): Promise<{
    bid: number;
    ask: number;
    spread: number;
    baseReserve: string;
    counterReserve: string;
  }> {
    try {
      const orderBook = await this.server
        .orderbook(this.assetToStellarAsset(base), this.assetToStellarAsset(counter))
        .call();

      if (orderBook.bids.length === 0 || orderBook.asks.length === 0) {
        throw new Error("No liquidity for this pair");
      }

      const bid = parseFloat(orderBook.bids[0].price);
      const ask = parseFloat(orderBook.asks[0].price);
      const spread = ((ask - bid) / bid) * 100;

      return {
        bid,
        ask,
        spread,
        baseReserve: orderBook.bids[0].amount || "0",
        counterReserve: orderBook.asks[0].amount || "0",
      };
    } catch (error) {
      console.error("[OrbitPath] Failed to get liquidity metrics:", error);
      return { bid: 0, ask: 0, spread: 0, baseReserve: "0", counterReserve: "0" };
    }
  }

  /**
   * Calculates fee for a multi-hop path
   * 
   * @param numHops - Number of intermediate conversions
   * @param sourceAmount - Source amount
   * @returns Total fee percentage
   */
  calculatePathFee(numHops: number, sourceAmount: string): number {
    // Each hop has:
    // - AMM fee: 0.3%
    // - Intermediary spread: 0.5%
    // Total per hop: ~0.8%
    const feePerHop = (AMM_FEE_PERCENT + INTERMEDIARY_FEE_PERCENT) / 100;
    const totalFee = feePerHop * numHops;
    return Math.min(totalFee, 5); // Cap at 5% max
  }

  /**
   * Estimates delivery time based on path complexity
   * 
   * @param path - Asset path
   * @returns Estimated time in milliseconds
   */
  estimateDeliveryTime(path: ConversionAsset[]): number {
    // Base: 3-5 seconds per Stellar block
    const blockTime = 4000;
    const numHops = Math.max(path.length - 2, 0);
    return blockTime + numHops * 2000; // Add 2s per hop
  }

  /**
   * Clears the path cache
   */
  clearCache(): void {
    this.pathCache.clear();
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  private getCacheKey(
    source: ConversionAsset,
    destination: ConversionAsset,
    amount: string
  ): string {
    return `${source.code}:${source.issuer}-${destination.code}:${destination.issuer}-${amount}`;
  }

  private assetsEqual(a: ConversionAsset, b: ConversionAsset): boolean {
    return a.code === b.code && a.issuer === b.issuer;
  }

  private assetToStellarAsset(asset: ConversionAsset): Asset {
    if (asset.code === "XLM" || asset.issuer === "native") {
      return Asset.native();
    }
    return new Asset(asset.code, asset.issuer);
  }

  private recordToPathOption(
    record: Horizon.TradeRecord | any,
    sourceAmount: string
  ): PathOption {
    // Extract path from record
    const path: ConversionAsset[] = [];
    
    // Add source (assumed to be XLM)
    path.push(COMMON_ASSETS.XLM);
    
    // Add intermediaries if any
    if (record.path && Array.isArray(record.path)) {
      for (const asset of record.path) {
        path.push({
          code: asset.asset_code || "XLM",
          issuer: asset.asset_issuer || "native",
        });
      }
    }

    const destAmount = record.destination_amount || sourceAmount;
    const totalFeePercent = this.calculatePathFee(
      Math.max(path.length - 2, 0),
      sourceAmount
    );

    return {
      path,
      sourceAmount,
      destinationAmount: destAmount,
      totalFeePercent,
      liquidity_score: 75, // Default mid-range score
      hops: Math.max(path.length - 2, 0),
      executionTime: this.estimateDeliveryTime(path),
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets recommended assets for conversion
 * Based on common liquidity pools and anchor support
 */
export function getRecommendedAssets(): ConversionAsset[] {
  return Object.values(COMMON_ASSETS);
}

/**
 * Validates an asset address
 */
export function isValidAssetIssuer(issuer: string): boolean {
  if (issuer === "native") return true;
  // Stellar addresses start with G and are 56 characters
  return /^G[A-Z2-7]{55}$/.test(issuer);
}

/**
 * Formats amount with proper decimals
 */
export function formatAmount(amount: string | number, decimals = 7): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(decimals);
}

/**
 * Calculates percentage savings
 */
export function calculateSavings(
  traditionalCost: number,
  orbitpathCost: number
): { amount: number; percent: number } {
  const savings = traditionalCost - orbitpathCost;
  const percent = (savings / traditionalCost) * 100;
  return { amount: Math.max(savings, 0), percent };
}

export default PathFinder;
