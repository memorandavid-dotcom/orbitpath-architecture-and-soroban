/**
 * OrbitPath Path Payment Transaction Builder
 * 
 * Constructs Stellar PathPayment operations for efficient cross-border transfers
 */

import {
  Server,
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
  Account,
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
  memo: string;
  signers: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const HORIZON_URL = "https://horizon.stellar.org";
const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";
const TESTNET_NETWORK_PASSPHRASE = Networks.TESTNET_NETWORK_PASSPHRASE;
const PUBLIC_NETWORK_PASSPHRASE = Networks.PUBLIC_NETWORK_PASSPHRASE;

// Standard Stellar transaction fee (in stroops)
const BASE_FEE = 100; // stroops = 0.00001 XLM
const DEFAULT_SLIPPAGE_PERCENT = 0.5; // 0.5% slippage tolerance

// ============================================================================
// CLASS: PathPaymentBuilder
// ============================================================================

export class PathPaymentBuilder {
  private server: Server;
  private network: "public" | "testnet";
  private networkPassphrase: string;

  constructor(network: "public" | "testnet" = "public") {
    const url = network === "testnet" ? HORIZON_TESTNET_URL : HORIZON_URL;
    this.server = new Server(url);
    this.network = network;
    this.networkPassphrase =
      network === "testnet"
        ? TESTNET_NETWORK_PASSPHRASE
        : PUBLIC_NETWORK_PASSPHRASE;
  }

  /**
   * Builds a PathPaymentStrictReceive transaction
   * 
   * Recipient receives exact amount; sender may send variable amount
   * 
   * @param params - Path payment parameters
   * @returns XDR transaction ready for signing
   */
  async buildPathPaymentStrictReceive(
    params: PathPaymentParams
  ): Promise<Transaction> {
    console.log("[OrbitPath] Building PathPaymentStrictReceive transaction");

    try {
      // Get sender's account sequence number
      const sourceAccount = await this.server.loadAccount(params.source);

      // Build operation
      const operation: any = {
        destination: params.destination,
        asset: this.assetToStellarAsset(params.destinationAsset),
        amount: params.destinationAmount,
        send_asset: this.assetToStellarAsset(params.sendAsset),
        send_max: params.sendMaxAmount,
        path: params.path.map((asset) => this.assetToStellarAsset(asset)),
      };

      // Build transaction
      let builder = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      });

      // Add memo if provided
      if (params.memo) {
        builder = builder.addMemo(Operation.memo(params.memo));
      }

      const transaction = builder
        .addOperation(Operation.pathPaymentStrictReceive(operation))
        .setTimeout(300) // 5 minute timeout
        .build();

      console.log("[OrbitPath] PathPaymentStrictReceive transaction built");
      return transaction;
    } catch (error) {
      console.error("[OrbitPath] Failed to build PathPaymentStrictReceive:", error);
      throw new Error(`Failed to build path payment: ${error}`);
    }
  }

  /**
   * Builds a PathPaymentStrictSend transaction
   * 
   * Sender sends exact amount; recipient may receive variable amount
   * 
   * @param params - Strict send parameters
   * @returns XDR transaction ready for signing
   */
  async buildPathPaymentStrictSend(
    params: PathPaymentStrictSendParams
  ): Promise<Transaction> {
    console.log("[OrbitPath] Building PathPaymentStrictSend transaction");

    try {
      // Get sender's account sequence number
      const sourceAccount = await this.server.loadAccount(params.source);

      // Build operation
      const operation: any = {
        destination: params.destination,
        asset: this.assetToStellarAsset(params.destinationAsset),
        dest_min: params.destinationMinAmount,
        send_asset: this.assetToStellarAsset(params.sendAsset),
        send_amount: params.sendAmount,
        path: params.path.map((asset) => this.assetToStellarAsset(asset)),
      };

      // Build transaction
      let builder = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      });

      // Add memo if provided
      if (params.memo) {
        builder = builder.addMemo(Operation.memo(params.memo));
      }

      const transaction = builder
        .addOperation(Operation.pathPaymentStrictSend(operation))
        .setTimeout(300)
        .build();

      console.log("[OrbitPath] PathPaymentStrictSend transaction built");
      return transaction;
    } catch (error) {
      console.error("[OrbitPath] Failed to build PathPaymentStrictSend:", error);
      throw new Error(`Failed to build path payment: ${error}`);
    }
  }

  /**
   * Builds a transaction from a PathOption
   * 
   * Convenience method that auto-calculates send_max with slippage
   * 
   * @param senderPublicKey - Sender's public key
   * @param recipientPublicKey - Recipient's public key
   * @param sourceAsset - Asset sender is sending
   * @param pathOption - Selected path option
   * @param slippagePercent - Acceptable slippage (default 0.5%)
   * @param memo - Optional memo field
   * @returns Transaction ready for signing
   */
  async buildFromPathOption(
    senderPublicKey: string,
    recipientPublicKey: string,
    sourceAsset: ConversionAsset,
    pathOption: PathOption,
    slippagePercent: number = DEFAULT_SLIPPAGE_PERCENT,
    memo?: string
  ): Promise<Transaction> {
    console.log("[OrbitPath] Building transaction from path option");

    // Calculate send_max with slippage tolerance
    const sourceAmount = parseFloat(pathOption.sourceAmount);
    const slippageMultiplier = 1 + slippagePercent / 100;
    const sendMax = (sourceAmount * slippageMultiplier).toFixed(7);

    // Remove source and destination from path to get intermediaries
    const intermediaries = pathOption.path.slice(1, -1);

    const params: PathPaymentParams = {
      source: senderPublicKey,
      destination: recipientPublicKey,
      destinationAsset: pathOption.path[pathOption.path.length - 1],
      destinationAmount: pathOption.destinationAmount,
      sendAsset: sourceAsset,
      sendMaxAmount: sendMax,
      path: intermediaries,
      memo,
      network: this.network,
    };

    return this.buildPathPaymentStrictReceive(params);
  }

  /**
   * Validates a built transaction before signing
   * 
   * @param transaction - Transaction to validate
   * @returns Validation result with any warnings
   */
  validateTransaction(transaction: Transaction): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check if transaction has operations
    if (!transaction.operations || transaction.operations.length === 0) {
      return { valid: false, warnings: ["Transaction has no operations"] };
    }

    // Check operation type
    const op = transaction.operations[0] as any;
    if (
      op.type !== "pathPaymentStrictReceive" &&
      op.type !== "pathPaymentStrictSend"
    ) {
      return { valid: false, warnings: ["Operation is not a path payment"] };
    }

    // Check amounts are positive
    if (parseFloat(op.amount || op.send_amount) <= 0) {
      warnings.push("Amount is zero or negative");
    }

    // Check for reasonable fee
    if (transaction.fee > 1000) {
      warnings.push(
        `Fee seems high: ${transaction.fee} stroops (${transaction.fee / 100000} XLM)`
      );
    }

    // Check if path exists
    if (!op.path || op.path.length === 0) {
      warnings.push("Path payment has empty path (direct transfer)");
    }

    return { valid: warnings.length === 0, warnings };
  }

  /**
   * Submits a signed transaction to the Stellar network
   * 
   * @param signedTransaction - Transaction signed by wallet
   * @returns Transaction result with hash and status
   */
  async submitTransaction(signedTransaction: Transaction): Promise<{
    hash: string;
    status: string;
    envelope: string;
  }> {
    console.log("[OrbitPath] Submitting signed transaction");

    try {
      const result = await this.server.submitTransaction(signedTransaction);
      console.log("[OrbitPath] Transaction submitted successfully:", result.hash);

      return {
        hash: result.hash,
        status: "submitted",
        envelope: signedTransaction.toEnvelope().toXDR("base64"),
      };
    } catch (error: any) {
      console.error("[OrbitPath] Transaction submission failed:", error);
      throw new Error(
        `Failed to submit transaction: ${error.message || error}`
      );
    }
  }

  /**
   * Polls for transaction confirmation
   * 
   * @param txHash - Transaction hash
   * @param maxRetries - Maximum polling attempts
   * @param delayMs - Delay between polls (milliseconds)
   * @returns Transaction result details
   */
  async pollTransactionStatus(
    txHash: string,
    maxRetries: number = 30,
    delayMs: number = 1000
  ): Promise<any> {
    console.log(`[OrbitPath] Polling transaction status: ${txHash}`);

    for (let i = 0; i < maxRetries; i++) {
      try {
        const tx = await this.server.transactions().transaction(txHash).call();
        console.log("[OrbitPath] Transaction confirmed!");
        return tx;
      } catch (error: any) {
        if (error.status === 404) {
          // Transaction not yet in ledger
          if (i < maxRetries - 1) {
            await this.delay(delayMs);
            continue;
          }
        } else {
          throw error;
        }
      }
    }

    throw new Error("Transaction confirmation timeout");
  }

  /**
   * Gets detailed information about a transaction
   * 
   * @param txHash - Transaction hash
   * @returns Full transaction details
   */
  async getTransactionDetails(txHash: string): Promise<any> {
    try {
      const tx = await this.server.transactions().transaction(txHash).call();
      return {
        hash: tx.hash,
        ledger: tx.ledger_attr,
        timestamp: tx.created_at,
        fee: tx.fee_charged,
        operations: tx.operation_count,
        successful: tx.successful,
        result: tx,
      };
    } catch (error) {
      console.error("[OrbitPath] Failed to get transaction details:", error);
      throw error;
    }
  }

  /**
   * Formats transaction details for display
   * 
   * @param txHash - Transaction hash
   * @returns Human-readable transaction summary
   */
  async getTransactionSummary(txHash: string): Promise<string> {
    const details = await this.getTransactionDetails(txHash);

    return `
Transaction Summary
===================
Hash: ${details.hash}
Ledger: ${details.ledger}
Time: ${new Date(details.timestamp).toLocaleString()}
Fee: ${details.fee} stroops (${details.fee / 100000} XLM)
Status: ${details.successful ? "SUCCESS" : "FAILED"}
Operations: ${details.operations}
    `.trim();
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  private assetToStellarAsset(asset: ConversionAsset): Asset {
    if (asset.code === "XLM" || asset.issuer === "native") {
      return Asset.native();
    }
    return new Asset(asset.code, asset.issuer);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates send_max with slippage tolerance
 */
export function calculateSendMax(
  sourceAmount: string,
  slippagePercent: number = DEFAULT_SLIPPAGE_PERCENT
): string {
  const amount = parseFloat(sourceAmount);
  const slippageMultiplier = 1 + slippagePercent / 100;
  return (amount * slippageMultiplier).toFixed(7);
}

/**
 * Estimates network fee for transaction
 */
export function estimateNetworkFee(
  numOperations: number = 1,
  baseFee: number = BASE_FEE
): number {
  return baseFee * numOperations;
}

/**
 * Formats XLM amount to stroops
 */
export function xlmToStroops(xlm: number): number {
  return Math.round(xlm * 10000000);
}

/**
 * Formats stroops to XLM
 */
export function stroopsToXlm(stroops: number): number {
  return stroops / 10000000;
}

export default PathPaymentBuilder;
