/**
 * Whale Movements Tracking Service
 * Monitors and stores large token movements
 */

import type {
  WhaleMovement,
  TransactionType,
  ParsedTransaction,
  WhaleConfig,
} from '../types';
import { DEFAULT_WHALE_CONFIG } from './whales';
import { formatAddress, formatUsd, getTokenSymbol } from '../utils/solana';

/** Maximum movements to keep in memory per token */
const MAX_MOVEMENTS_PER_TOKEN = 1000;

/** Maximum age for movements (7 days) */
const MAX_MOVEMENT_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** In-memory storage for movements by token */
const movementsByToken = new Map<string, WhaleMovement[]>();

/** Global movements list (all tokens) */
const recentMovements: WhaleMovement[] = [];

/**
 * Generate a unique ID for a movement
 */
function generateMovementId(signature: string, whale: string): string {
  return `${signature.slice(0, 8)}-${whale.slice(0, 8)}-${Date.now()}`;
}

/**
 * Check if a transaction qualifies as a significant movement
 * 
 * @param usdValue - USD value of the movement
 * @param config - Whale configuration
 * @returns True if movement should be tracked
 */
export function isSignificantMovement(
  usdValue: number,
  config: WhaleConfig = DEFAULT_WHALE_CONFIG
): boolean {
  return usdValue >= config.minMovementUsd;
}

/**
 * Categorize a transaction into movement type
 * 
 * @param tx - Parsed transaction
 * @returns Detailed movement type
 */
export function categorizeMovement(tx: ParsedTransaction): TransactionType {
  return tx.type;
}

/**
 * Create a movement record from a parsed transaction
 * 
 * @param tx - Parsed transaction
 * @param whale - Whale wallet address
 * @param tokenMint - Token mint being tracked
 * @param tokenPrice - Current token price
 * @returns Movement record or null if not significant
 */
export function createMovement(
  tx: ParsedTransaction,
  whale: string,
  tokenMint: string,
  tokenPrice: number,
  config: WhaleConfig = DEFAULT_WHALE_CONFIG
): WhaleMovement | null {
  let amount = 0;
  let direction: 'in' | 'out' = 'out';

  if (tx.type === 'swap') {
    // For swaps, check if we're buying or selling the tracked token
    if (tx.tokenOut?.mint === tokenMint) {
      // Buying (token coming in)
      amount = tx.tokenOut.uiAmount;
      direction = 'in';
    } else if (tx.tokenIn?.mint === tokenMint) {
      // Selling (token going out)
      amount = tx.tokenIn.uiAmount;
      direction = 'out';
    } else {
      return null; // Not related to tracked token
    }
  } else if (tx.type === 'transfer' && tx.transfer?.mint === tokenMint) {
    amount = tx.transfer.uiAmount;
    // Direction would need to be determined by checking from/to addresses
    // For now, assume outgoing
    direction = 'out';
  } else if (tx.type === 'stake' || tx.type === 'unstake') {
    // For staking, we'd need additional logic
    // Simplified: treat stake as out, unstake as in
    direction = tx.type === 'stake' ? 'out' : 'in';
    if (tx.tokenIn) {
      amount = tx.tokenIn.uiAmount;
    }
  } else {
    return null;
  }

  const usdValue = amount * tokenPrice;

  if (!isSignificantMovement(usdValue, config)) {
    return null;
  }

  return {
    id: generateMovementId(tx.signature, whale),
    timestamp: tx.timestamp * 1000,
    whale,
    type: tx.type,
    tokenMint,
    amount,
    usdValue,
    signature: tx.signature,
    direction,
  };
}

/**
 * Record a whale movement
 * 
 * @param movement - Movement to record
 */
export function recordMovement(movement: WhaleMovement): void {
  // Add to global list
  recentMovements.unshift(movement);
  
  // Add to token-specific list
  if (!movementsByToken.has(movement.tokenMint)) {
    movementsByToken.set(movement.tokenMint, []);
  }
  const tokenMovements = movementsByToken.get(movement.tokenMint)!;
  tokenMovements.unshift(movement);
  
  // Cleanup old movements
  pruneMovements();
}

/**
 * Process a batch of transactions and extract movements
 * 
 * @param transactions - Parsed transactions
 * @param whale - Whale wallet address
 * @param tokenMint - Token to track
 * @param tokenPrice - Current token price
 * @param config - Configuration
 * @returns Array of recorded movements
 */
export function processTransactions(
  transactions: ParsedTransaction[],
  whale: string,
  tokenMint: string,
  tokenPrice: number,
  config: WhaleConfig = DEFAULT_WHALE_CONFIG
): WhaleMovement[] {
  const recorded: WhaleMovement[] = [];

  for (const tx of transactions) {
    const movement = createMovement(tx, whale, tokenMint, tokenPrice, config);
    if (movement) {
      recordMovement(movement);
      recorded.push(movement);
    }
  }

  return recorded;
}

/**
 * Get recent movements for a specific token
 * 
 * @param tokenMint - Token mint address
 * @param limit - Maximum number to return
 * @returns Array of movements, newest first
 */
export function getMovementsByToken(
  tokenMint: string,
  limit: number = 50
): WhaleMovement[] {
  const movements = movementsByToken.get(tokenMint) || [];
  return movements.slice(0, limit);
}

/**
 * Get recent movements for a specific whale
 * 
 * @param whaleAddress - Whale wallet address
 * @param limit - Maximum number to return
 * @returns Array of movements, newest first
 */
export function getMovementsByWhale(
  whaleAddress: string,
  limit: number = 50
): WhaleMovement[] {
  return recentMovements
    .filter((m) => m.whale === whaleAddress)
    .slice(0, limit);
}

/**
 * Get all recent movements across all tokens
 * 
 * @param limit - Maximum number to return
 * @returns Array of movements, newest first
 */
export function getAllRecentMovements(limit: number = 100): WhaleMovement[] {
  return recentMovements.slice(0, limit);
}

/**
 * Get movements filtered by type
 * 
 * @param type - Movement type to filter
 * @param limit - Maximum number to return
 * @returns Filtered movements
 */
export function getMovementsByType(
  type: TransactionType,
  limit: number = 50
): WhaleMovement[] {
  return recentMovements.filter((m) => m.type === type).slice(0, limit);
}

/**
 * Get movements above a certain USD value
 * 
 * @param minUsd - Minimum USD value
 * @param limit - Maximum number to return
 * @returns Filtered movements
 */
export function getLargeMovements(
  minUsd: number,
  limit: number = 50
): WhaleMovement[] {
  return recentMovements.filter((m) => m.usdValue >= minUsd).slice(0, limit);
}

/**
 * Calculate movement statistics for a token
 * 
 * @param tokenMint - Token mint address
 * @param windowMs - Time window in milliseconds
 * @returns Statistics object
 */
export function getMovementStats(
  tokenMint: string,
  windowMs: number = 24 * 60 * 60 * 1000
): {
  totalMovements: number;
  totalVolumeUsd: number;
  inflows: number;
  outflows: number;
  inflowVolumeUsd: number;
  outflowVolumeUsd: number;
  largestMovement: WhaleMovement | null;
  averageMovementUsd: number;
  swaps: number;
  transfers: number;
  stakes: number;
} {
  const cutoff = Date.now() - windowMs;
  const movements = (movementsByToken.get(tokenMint) || []).filter(
    (m) => m.timestamp >= cutoff
  );

  const inflows = movements.filter((m) => m.direction === 'in');
  const outflows = movements.filter((m) => m.direction === 'out');

  const inflowVolumeUsd = inflows.reduce((sum, m) => sum + m.usdValue, 0);
  const outflowVolumeUsd = outflows.reduce((sum, m) => sum + m.usdValue, 0);
  const totalVolumeUsd = inflowVolumeUsd + outflowVolumeUsd;

  const largestMovement = movements.reduce<WhaleMovement | null>(
    (largest, m) => (!largest || m.usdValue > largest.usdValue ? m : largest),
    null
  );

  return {
    totalMovements: movements.length,
    totalVolumeUsd,
    inflows: inflows.length,
    outflows: outflows.length,
    inflowVolumeUsd,
    outflowVolumeUsd,
    largestMovement,
    averageMovementUsd: movements.length > 0 ? totalVolumeUsd / movements.length : 0,
    swaps: movements.filter((m) => m.type === 'swap').length,
    transfers: movements.filter((m) => m.type === 'transfer').length,
    stakes: movements.filter((m) => m.type === 'stake' || m.type === 'unstake').length,
  };
}

/**
 * Format a movement for display
 * 
 * @param movement - Movement to format
 * @returns Human-readable string
 */
export function formatMovement(movement: WhaleMovement): string {
  const direction = movement.direction === 'in' ? '📈' : '📉';
  const typeEmoji = {
    swap: '🔄',
    transfer: '➡️',
    stake: '🔒',
    unstake: '🔓',
    unknown: '❓',
  }[movement.type];

  const whale = formatAddress(movement.whale);
  const token = getTokenSymbol(movement.tokenMint);
  const value = formatUsd(movement.usdValue);

  return `${direction} ${typeEmoji} ${whale} ${movement.type} ${value} of ${token}`;
}

/**
 * Prune old movements to prevent memory bloat
 */
function pruneMovements(): void {
  const cutoff = Date.now() - MAX_MOVEMENT_AGE_MS;

  // Prune global list
  while (
    recentMovements.length > 0 &&
    (recentMovements.length > MAX_MOVEMENTS_PER_TOKEN * 10 ||
      recentMovements[recentMovements.length - 1].timestamp < cutoff)
  ) {
    recentMovements.pop();
  }

  // Prune per-token lists
  for (const [token, movements] of movementsByToken.entries()) {
    while (
      movements.length > MAX_MOVEMENTS_PER_TOKEN ||
      (movements.length > 0 && movements[movements.length - 1].timestamp < cutoff)
    ) {
      movements.pop();
    }

    if (movements.length === 0) {
      movementsByToken.delete(token);
    }
  }
}

/**
 * Clear all stored movements (for testing or reset)
 */
export function clearMovements(): void {
  recentMovements.length = 0;
  movementsByToken.clear();
}

/**
 * Get net flow for a token (inflows - outflows)
 * 
 * @param tokenMint - Token mint address
 * @param windowMs - Time window
 * @returns Net flow statistics
 */
export function getNetFlow(
  tokenMint: string,
  windowMs: number = 24 * 60 * 60 * 1000
): {
  netFlowUsd: number;
  netFlowAmount: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
} {
  const stats = getMovementStats(tokenMint, windowMs);
  const netFlowUsd = stats.inflowVolumeUsd - stats.outflowVolumeUsd;

  // Calculate net amount (would need to track amounts separately)
  const cutoff = Date.now() - windowMs;
  const movements = (movementsByToken.get(tokenMint) || []).filter(
    (m) => m.timestamp >= cutoff
  );

  const netFlowAmount = movements.reduce((sum, m) => {
    return sum + (m.direction === 'in' ? m.amount : -m.amount);
  }, 0);

  // Determine sentiment
  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (netFlowUsd > 10_000) {
    sentiment = 'bullish';
  } else if (netFlowUsd < -10_000) {
    sentiment = 'bearish';
  }

  return { netFlowUsd, netFlowAmount, sentiment };
}
