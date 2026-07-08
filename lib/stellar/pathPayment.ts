/**
 * OrbitPath Path Payment Transaction Builder
 * 
 * Constructs Stellar PathPayment operations for efficient cross-border transfers
 */

import {
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
  FeeBumpTransaction,
  Transaction,
} from "@stellar/stellar-sdk";

import { ConversionAsset, PathOption } from "./pathfinding";

// ============================================================================
// TYPES
// ============================================================================

export interface PathPaymentParams {
  source: string; // Sender's public key
  destination: string; // Recipient's public key
  destinationAsset: ConversionAsset;
  destinationAmount: string; // Exact amount recipient should receive
  sendAsset: ConversionAsset;
  sendMaxAmount: string; // Max amount sender will send (includes slippage)
  path: ConversionAsset[]; // Conversion path
  memo?: string;
  network?: "public" | "testnet";
}

export interface PathPaymentStrictSendParams {
  source: string;
  destination: string;
  destinationAsset: ConversionAsset;
  destinationMinAmount: string; // Minimum recipient will receive
  sendAsset: ConversionAsset;
  sendAmount: string; // Exact amount sender sends
  path: ConversionAsset[];
  memo?: string;
  network?: "public" | "testnet";
}

export interface TransactionDetails {
  xdr: string;
  hash: string;
  fee: number;
  operations: Operation[];
  path: ConversionAsset[];
  sourceAmount: string;
  destinationAmount: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const NETWORK_BASE_FEE = 100; // stroops
const DEFAULT_TIMEOUT = 300; // 5 minutes

// ============================================================================
// CLASS: PathPaymentBuilder
// ============================================================================

export class PathPaymentBuilder {
  /**
   * Builds a PathPaymentStrictReceive transaction
   * (Sender specifies max send amount, recipient gets exact amount)
   */
  static buildPathPaymentStrictReceive(
    params: PathPaymentParams
  ): TransactionDetails {
    const {
      source,
      destination,
      destinationAsset,
      destinationAmount,
      sendAsset,
      sendMaxAmount,
      path,
      memo,
      network = "testnet",
    } = params;

    try {
      // Convert to Stellar Assets
      const sendStellarAsset = this.convertToStellarAsset(sendAsset);
      const destStellarAsset = this.convertToStellarAsset(destinationAsset);
      const pathAssets = path
        .slice(1, -1) // Exclude source and destination
        .map((asset) => this.convertToStellarAsset(asset));

      // Create transaction builder
      const networkPassphrase =
        network === "public" ? Networks.PUBLIC_NETWORK : Networks.TESTNET_NETWORK;

      const transactionBuilder = new TransactionBuilder(
        {
          accountId: source,
          sequence: "0", // Will be updated by signing wallet
          incrementSequenceNumber: false,
        },
        {
          fee: NETWORK_BASE_FEE.toString(),
          networkPassphrase,
          timebounds: {
            minTime: 0,
            maxTime: Math.floor(Date.now() / 1000) + DEFAULT_TIMEOUT,
          },
        }
      );

      // Add memo if provided
      if (memo) {
        transactionBuilder.addMemo({
          type: "text",
          value: memo,
        });
      }

      // Add PathPaymentStrictReceive operation
      transactionBuilder.addOperation(
        Operation.pathPaymentStrictReceive({
          destination,
          sendAsset: sendStellarAsset,
          sendMax: sendMaxAmount,
          destAsset: destStellarAsset,
          destAmount: destinationAmount,
          path: pathAssets,
        })
      );

      const transaction = transactionBuilder.build();

      return {
        xdr: transaction.toEnvelope().toXDR("base64"),
        hash: transaction.hash().toString("hex"),
        fee: parseInt(transaction.fee),
        operations: transaction.operations,
        path: path,
        sourceAmount: sendMaxAmount,
        destinationAmount,
      };
    } catch (error) {
      console.error("[OrbitPath] Error building PathPaymentStrictReceive:", error);
      throw error;
    }
  }

  /**
   * Builds a PathPaymentStrictSend transaction
   * (Sender sends exact amount, recipient gets minimum amount)
   */
  static buildPathPaymentStrictSend(
    params: PathPaymentStrictSendParams
  ): TransactionDetails {
    const {
      source,
      destination,
      destinationAsset,
      destinationMinAmount,
      sendAsset,
      sendAmount,
      path,
      memo,
      network = "testnet",
    } = params;

    try {
      // Convert to Stellar Assets
      const sendStellarAsset = this.convertToStellarAsset(sendAsset);
      const destStellarAsset = this.convertToStellarAsset(destinationAsset);
      const pathAssets = path
        .slice(1, -1) // Exclude source and destination
        .map((asset) => this.convertToStellarAsset(asset));

      // Create transaction builder
      const networkPassphrase =
        network === "public" ? Networks.PUBLIC_NETWORK : Networks.TESTNET_NETWORK;

      const transactionBuilder = new TransactionBuilder(
        {
          accountId: source,
          sequence: "0", // Will be updated by signing wallet
          incrementSequenceNumber: false,
        },
        {
          fee: NETWORK_BASE_FEE.toString(),
          networkPassphrase,
          timebounds: {
            minTime: 0,
            maxTime: Math.floor(Date.now() / 1000) + DEFAULT_TIMEOUT,
          },
        }
      );

      // Add memo if provided
      if (memo) {
        transactionBuilder.addMemo({
          type: "text",
          value: memo,
        });
      }

      // Add PathPaymentStrictSend operation
      transactionBuilder.addOperation(
        Operation.pathPaymentStrictSend({
          destination,
          sendAsset: sendStellarAsset,
          sendAmount: sendAmount,
          destAsset: destStellarAsset,
          destMin: destinationMinAmount,
          path: pathAssets,
        })
      );

      const transaction = transactionBuilder.build();

      return {
        xdr: transaction.toEnvelope().toXDR("base64"),
        hash: transaction.hash().toString("hex"),
        fee: parseInt(transaction.fee),
        operations: transaction.operations,
        path: path,
        sourceAmount: sendAmount,
        destinationAmount: destinationMinAmount,
      };
    } catch (error) {
      console.error("[OrbitPath] Error building PathPaymentStrictSend:", error);
      throw error;
    }
  }

  /**
   * Estimates fees for a path payment
   */
  static estimateFees(
    sourceAmount: string,
    feePercent: number,
    hops: number
  ): {
    networkFee: number;
    routingFee: number;
    totalFee: number;
    totalFeePercent: number;
  } {
    const networkFee = NETWORK_BASE_FEE / 10_000_000; // Convert stroops to XLM

    // Estimate routing fee based on hops and fee percent
    const routingFee = (parseFloat(sourceAmount) * feePercent) / 100;

    const totalFee = networkFee + routingFee;
    const totalFeePercent = (totalFee / parseFloat(sourceAmount)) * 100;

    return {
      networkFee,
      routingFee,
      totalFee,
      totalFeePercent,
    };
  }

  /**
   * Converts ConversionAsset to Stellar Asset
   */
  private static convertToStellarAsset(asset: ConversionAsset): Asset {
    if (asset.code === "XLM" && asset.issuer === "native") {
      return Asset.native();
    }
    return new Asset(asset.code, asset.issuer);
  }

  /**
   * Parses a transaction XDR string
   */
  static parseTransactionXDR(xdr: string, network: "public" | "testnet" = "testnet") {
    try {
      const networkPassphrase =
        network === "public" ? Networks.PUBLIC_NETWORK : Networks.TESTNET_NETWORK;

      const transaction = TransactionBuilder.fromXDR(xdr, networkPassphrase);

      return {
        source: transaction.source,
        fee: transaction.fee,
        sequence: transaction.sequence,
        operations: transaction.operations,
        memo: transaction.memo,
        valid: true,
      };
    } catch (error) {
      console.error("[OrbitPath] Error parsing transaction XDR:", error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates slippage for a payment path
 */
export function calculateSlippage(
  expectedAmount: string,
  tolerancePercent: number = 1
): string {
  const expectedValue = parseFloat(expectedAmount);
  const slippageAmount = (expectedValue * tolerancePercent) / 100;
  const minAmount = expectedValue - slippageAmount;
  return Math.max(0, minAmount).toFixed(7);
}

/**
 * Formats transaction fee in stroops
 */
export function formatFee(stroops: number): string {
  const xlm = stroops / 10_000_000;
  return `${xlm.toFixed(7)} XLM`;
}

export default PathPaymentBuilder;
