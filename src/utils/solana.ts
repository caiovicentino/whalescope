/**
 * Solana Utilities
 * Helper functions for Solana address formatting and conversions
 */

/** SOL has 9 decimals */
export const SOL_DECIMALS = 9;

/** Lamports per SOL */
export const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Common token mints on Solana mainnet
 */
export const TOKEN_MINTS = {
  /** Native SOL (wrapped) */
  SOL: 'So11111111111111111111111111111111111111112',
  /** USDC */
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  /** USDT */
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  /** Bonk */
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  /** Jupiter */
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  /** Raydium */
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  /** Marinade Staked SOL */
  mSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  /** Jito Staked SOL */
  jitoSOL: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
  /** Pyth */
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  /** Wormhole */
  W: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ',
} as const;

/** Token symbols by mint address (reverse lookup) */
export const TOKEN_SYMBOLS: Record<string, string> = Object.fromEntries(
  Object.entries(TOKEN_MINTS).map(([symbol, mint]) => [mint, symbol])
);

/**
 * Format a Solana address for display
 * @param address - Full address string
 * @param chars - Number of characters to show on each end (default 4)
 * @returns Shortened address like "7xKX...4Hn9"
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address || address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Convert lamports to SOL
 * @param lamports - Amount in lamports
 * @returns Amount in SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Convert SOL to lamports
 * @param sol - Amount in SOL
 * @returns Amount in lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

/**
 * Convert token amount to UI amount based on decimals
 * @param amount - Raw token amount (as bigint or number)
 * @param decimals - Token decimals
 * @returns Human-readable amount
 */
export function toUiAmount(amount: number | bigint, decimals: number): number {
  return Number(amount) / Math.pow(10, decimals);
}

/**
 * Convert UI amount to raw token amount
 * @param uiAmount - Human-readable amount
 * @param decimals - Token decimals
 * @returns Raw token amount
 */
export function toRawAmount(uiAmount: number, decimals: number): bigint {
  return BigInt(Math.floor(uiAmount * Math.pow(10, decimals)));
}

/**
 * Validate a Solana address format
 * @param address - Address to validate
 * @returns True if valid base58 format
 */
export function isValidAddress(address: string): boolean {
  // Base58 characters (no 0, O, I, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Get token symbol from mint address
 * @param mint - Token mint address
 * @returns Symbol if known, otherwise shortened address
 */
export function getTokenSymbol(mint: string): string {
  return TOKEN_SYMBOLS[mint] || formatAddress(mint, 4);
}

/**
 * Check if a mint is a known stablecoin
 * @param mint - Token mint address
 * @returns True if USDC or USDT
 */
export function isStablecoin(mint: string): boolean {
  return mint === TOKEN_MINTS.USDC || mint === TOKEN_MINTS.USDT;
}

/**
 * Check if a mint is native SOL (wrapped)
 * @param mint - Token mint address
 * @returns True if wrapped SOL
 */
export function isNativeSol(mint: string): boolean {
  return mint === TOKEN_MINTS.SOL;
}

/**
 * Format a number with appropriate precision
 * @param value - Number to format
 * @param decimals - Max decimal places (default 2)
 * @returns Formatted string
 */
export function formatAmount(value: number, decimals: number = 2): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

/**
 * Format USD value
 * @param value - USD amount
 * @returns Formatted string like "$1.5M" or "$500K"
 */
export function formatUsd(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}
