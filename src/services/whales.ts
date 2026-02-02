// @ts-nocheck
/**
 * Whale Detection Service
 * Core logic for identifying and tracking whale wallets
 */

import type {
  WhaleProfile,
  WhaleBehavior,
  Pattern,
  WhaleConfig,
  ParsedTransaction,
} from '../types';
import {
  getLargestTokenHolders,
  getRecentTransactions,
  parseTransactionData,
} from './helius';
import { formatAddress } from '../utils/solana';

/** Default whale detection configuration */
export const DEFAULT_WHALE_CONFIG: WhaleConfig = {
  /** Minimum $100k to be considered a whale */
  minWhaleHoldingsUsd: 100_000,
  /** Track movements above $10k */
  minMovementUsd: 10_000,
  /** 24-hour window for pattern detection */
  patternWindowMs: 24 * 60 * 60 * 1000,
  /** Minimum 3 transactions to establish a pattern */
  minPatternTxCount: 3,
};

/** In-memory storage for tracked whales by token */
const whaleRegistry = new Map<string, Map<string, WhaleProfile>>();

/** Transaction history for pattern detection */
const transactionHistory = new Map<string, ParsedTransaction[]>();

/**
 * Check if a wallet qualifies as a whale based on holdings
 * 
 * @param usdValue - Total USD value of holdings
 * @param config - Whale configuration (optional)
 * @returns True if wallet is a whale
 */
export function isWhale(
  usdValue: number,
  config: WhaleConfig = DEFAULT_WHALE_CONFIG
): boolean {
  return usdValue >= config.minWhaleHoldingsUsd;
}

/**
 * Discover whale wallets for a specific token
 * Queries largest holders and filters by minimum holdings
 * 
 * @param tokenMint - Token mint address
 * @param tokenPrice - Current token price in USD
 * @param config - Whale configuration
 * @returns Array of whale profiles
 */
export async function discoverWhales(
  tokenMint: string,
  tokenPrice: number,
  config: WhaleConfig = DEFAULT_WHALE_CONFIG
): Promise<WhaleProfile[]> {
  const holders = await getLargestTokenHolders(tokenMint, 100);
  const now = Date.now();
  
  const whales: WhaleProfile[] = [];
  
  for (const holder of holders) {
    const usdValue = holder.uiAmount * tokenPrice;
    
    if (isWhale(usdValue, config)) {
      const profile: WhaleProfile = {
        address: holder.address,
        tokenMint,
        holdings: holder.uiAmount,
        usdValue,
        firstSeen: now,
        lastActivity: now,
        behavior: 'unknown',
        recentTxCount: 0,
      };
      
      whales.push(profile);
      
      // Add to registry
      if (!whaleRegistry.has(tokenMint)) {
        whaleRegistry.set(tokenMint, new Map());
      }
      whaleRegistry.get(tokenMint)!.set(holder.address, profile);
    }
  }
  
  return whales;
}

/**
 * Get all tracked whales for a token
 * 
 * @param tokenMint - Token mint address
 * @returns Array of whale profiles
 */
export function getTrackedWhales(tokenMint: string): WhaleProfile[] {
  const registry = whaleRegistry.get(tokenMint);
  return registry ? Array.from(registry.values()) : [];
}

/**
 * Get a specific whale profile
 * 
 * @param tokenMint - Token mint address
 * @param walletAddress - Whale wallet address
 * @returns Whale profile or undefined
 */
export function getWhaleProfile(
  tokenMint: string,
  walletAddress: string
): WhaleProfile | undefined {
  return whaleRegistry.get(tokenMint)?.get(walletAddress);
}

/**
 * Update whale profile with new data
 * 
 * @param tokenMint - Token mint address
 * @param walletAddress - Whale wallet address
 * @param update - Partial profile update
 */
export function updateWhaleProfile(
  tokenMint: string,
  walletAddress: string,
  update: Partial<WhaleProfile>
): void {
  const registry = whaleRegistry.get(tokenMint);
  if (!registry) return;
  
  const profile = registry.get(walletAddress);
  if (!profile) return;
  
  Object.assign(profile, update, { lastActivity: Date.now() });
}

/**
 * Analyze whale behavior based on recent transactions
 * 
 * @param walletAddress - Whale wallet address
 * @param tokenMint - Token to analyze
 * @param transactions - Recent transactions
 * @param config - Whale configuration
 * @returns Detected behavior pattern
 */
export function analyzeWhaleBehavior(
  walletAddress: string,
  tokenMint: string,
  transactions: ParsedTransaction[],
  config: WhaleConfig = DEFAULT_WHALE_CONFIG
): WhaleBehavior {
  const now = Date.now();
  const windowStart = now - config.patternWindowMs;
  
  // Filter transactions within the time window
  const recentTxs = transactions.filter(
    (tx) => tx.timestamp * 1000 >= windowStart
  );
  
  if (recentTxs.length < config.minPatternTxCount) {
    return 'holding';
  }
  
  // Count buys vs sells for the tracked token
  let buyCount = 0;
  let sellCount = 0;
  let buyVolume = 0;
  let sellVolume = 0;
  
  for (const tx of recentTxs) {
    if (tx.type === 'swap') {
      // Check if tokenOut is the tracked token (buying)
      if (tx.tokenOut?.mint === tokenMint) {
        buyCount++;
        buyVolume += tx.tokenOut.uiAmount;
      }
      // Check if tokenIn is the tracked token (selling)
      if (tx.tokenIn?.mint === tokenMint) {
        sellCount++;
        sellVolume += tx.tokenIn.uiAmount;
      }
    } else if (tx.type === 'transfer' && tx.transfer?.mint === tokenMint) {
      // For transfers, we need to check direction
      // This is simplified; in practice we'd check from/to
      buyCount++;
    }
  }
  
  // Determine behavior based on activity
  const totalTxs = buyCount + sellCount;
  if (totalTxs < config.minPatternTxCount) {
    return 'holding';
  }
  
  const buyRatio = buyCount / totalTxs;
  
  if (buyRatio >= 0.7) {
    return 'accumulating';
  } else if (buyRatio <= 0.3) {
    return 'distributing';
  }
  
  return 'holding';
}

/**
 * Detect accumulation patterns for a whale
 * Multiple buys over a time window with increasing position
 * 
 * @param walletAddress - Whale wallet address
 * @param tokenMint - Token to analyze
 * @param transactions - Transaction history
 * @param tokenPrice - Current token price
 * @param config - Configuration
 * @returns Pattern if detected, null otherwise
 */
export function detectAccumulationPattern(
  walletAddress: string,
  tokenMint: string,
  transactions: ParsedTransaction[],
  tokenPrice: number,
  config: WhaleConfig = DEFAULT_WHALE_CONFIG
): Pattern | null {
  const now = Date.now();
  const windowStart = now - config.patternWindowMs;
  
  // Find buy transactions for the token
  const buys = transactions.filter((tx) => {
    if (tx.timestamp * 1000 < windowStart) return false;
    if (tx.type !== 'swap') return false;
    return tx.tokenOut?.mint === tokenMint;
  });
  
  if (buys.length < config.minPatternTxCount) {
    return null;
  }
  
  // Calculate pattern metrics
  const totalAmount = buys.reduce(
    (sum, tx) => sum + (tx.tokenOut?.uiAmount || 0),
    0
  );
  const totalUsdValue = totalAmount * tokenPrice;
  
  // Check if significant enough
  if (totalUsdValue < config.minMovementUsd * config.minPatternTxCount) {
    return null;
  }
  
  // Calculate confidence based on consistency
  const avgBuySize = totalAmount / buys.length;
  const variance = buys.reduce((sum, tx) => {
    const diff = (tx.tokenOut?.uiAmount || 0) - avgBuySize;
    return sum + diff * diff;
  }, 0) / buys.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avgBuySize; // Coefficient of variation
  
  // Lower CV = more consistent buys = higher confidence
  const confidence = Math.max(0, Math.min(1, 1 - cv));
  
  const timestamps = buys.map((tx) => tx.timestamp);
  
  return {
    whale: walletAddress,
    tokenMint,
    type: 'accumulation',
    txCount: buys.length,
    totalAmount,
    totalUsdValue,
    startTime: Math.min(...timestamps) * 1000,
    endTime: Math.max(...timestamps) * 1000,
    confidence,
  };
}

/**
 * Detect distribution patterns for a whale
 * Multiple sells over a time window with decreasing position
 * 
 * @param walletAddress - Whale wallet address
 * @param tokenMint - Token to analyze
 * @param transactions - Transaction history
 * @param tokenPrice - Current token price
 * @param config - Configuration
 * @returns Pattern if detected, null otherwise
 */
export function detectDistributionPattern(
  walletAddress: string,
  tokenMint: string,
  transactions: ParsedTransaction[],
  tokenPrice: number,
  config: WhaleConfig = DEFAULT_WHALE_CONFIG
): Pattern | null {
  const now = Date.now();
  const windowStart = now - config.patternWindowMs;
  
  // Find sell transactions for the token
  const sells = transactions.filter((tx) => {
    if (tx.timestamp * 1000 < windowStart) return false;
    if (tx.type !== 'swap') return false;
    return tx.tokenIn?.mint === tokenMint;
  });
  
  if (sells.length < config.minPatternTxCount) {
    return null;
  }
  
  // Calculate pattern metrics
  const totalAmount = sells.reduce(
    (sum, tx) => sum + (tx.tokenIn?.uiAmount || 0),
    0
  );
  const totalUsdValue = totalAmount * tokenPrice;
  
  if (totalUsdValue < config.minMovementUsd * config.minPatternTxCount) {
    return null;
  }
  
  // Calculate confidence
  const avgSellSize = totalAmount / sells.length;
  const variance = sells.reduce((sum, tx) => {
    const diff = (tx.tokenIn?.uiAmount || 0) - avgSellSize;
    return sum + diff * diff;
  }, 0) / sells.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avgSellSize;
  const confidence = Math.max(0, Math.min(1, 1 - cv));
  
  const timestamps = sells.map((tx) => tx.timestamp);
  
  return {
    whale: walletAddress,
    tokenMint,
    type: 'distribution',
    txCount: sells.length,
    totalAmount,
    totalUsdValue,
    startTime: Math.min(...timestamps) * 1000,
    endTime: Math.max(...timestamps) * 1000,
    confidence,
  };
}

/**
 * Analyze a whale and detect any patterns
 * 
 * @param walletAddress - Whale wallet address
 * @param tokenMint - Token to analyze
 * @param tokenPrice - Current token price
 * @param config - Configuration
 * @returns Object with behavior and any detected patterns
 */
export async function analyzeWhale(
  walletAddress: string,
  tokenMint: string,
  tokenPrice: number,
  config: WhaleConfig = DEFAULT_WHALE_CONFIG
): Promise<{
  behavior: WhaleBehavior;
  patterns: Pattern[];
}> {
  // Fetch recent transactions
  const rawTxs = await getRecentTransactions(walletAddress, 100);
  
  // Parse transactions
  const transactions = rawTxs.map((tx) =>
    parseTransactionData(tx, walletAddress)
  );
  
  // Store for future reference
  transactionHistory.set(walletAddress, transactions);
  
  // Analyze behavior
  const behavior = analyzeWhaleBehavior(
    walletAddress,
    tokenMint,
    transactions,
    config
  );
  
  // Detect patterns
  const patterns: Pattern[] = [];
  
  const accumulation = detectAccumulationPattern(
    walletAddress,
    tokenMint,
    transactions,
    tokenPrice,
    config
  );
  if (accumulation) {
    patterns.push(accumulation);
  }
  
  const distribution = detectDistributionPattern(
    walletAddress,
    tokenMint,
    transactions,
    tokenPrice,
    config
  );
  if (distribution) {
    patterns.push(distribution);
  }
  
  // Update whale profile
  updateWhaleProfile(tokenMint, walletAddress, {
    behavior,
    recentTxCount: transactions.length,
  });
  
  return { behavior, patterns };
}

/**
 * Get a summary of whale activity for a token
 * 
 * @param tokenMint - Token mint address
 * @returns Summary statistics
 */
export function getWhaleActivitySummary(tokenMint: string): {
  totalWhales: number;
  accumulating: number;
  distributing: number;
  holding: number;
  totalHoldingsUsd: number;
} {
  const whales = getTrackedWhales(tokenMint);
  
  return {
    totalWhales: whales.length,
    accumulating: whales.filter((w) => w.behavior === 'accumulating').length,
    distributing: whales.filter((w) => w.behavior === 'distributing').length,
    holding: whales.filter((w) => w.behavior === 'holding').length,
    totalHoldingsUsd: whales.reduce((sum, w) => sum + w.usdValue, 0),
  };
}

/**
 * Clear whale registry (for testing or reset)
 */
export function clearWhaleRegistry(): void {
  whaleRegistry.clear();
  transactionHistory.clear();
}
