/**
 * WhaleScope Mock Data
 * Used for API development before core services are ready
 */

import type { Whale, Movement, Signal } from '../types/api';

// ============================================
// Mock Whales
// ============================================

export const mockWhales: Whale[] = [
  {
    address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
    label: 'Raydium Authority',
    totalValueUsd: 125_000_000,
    tokenCount: 15,
    tier: 'mega',
    firstSeen: Date.now() - 365 * 24 * 60 * 60 * 1000,
    lastActive: Date.now() - 2 * 60 * 60 * 1000,
    tags: ['dex', 'raydium', 'liquidity'],
    topHoldings: [
      {
        mint: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Wrapped SOL',
        amount: '500000000000000',
        uiAmount: 500000,
        valueUsd: 75_000_000,
        portfolioPercent: 60,
      },
      {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        name: 'USD Coin',
        amount: '25000000000000',
        uiAmount: 25_000_000,
        valueUsd: 25_000_000,
        portfolioPercent: 20,
      },
    ],
  },
  {
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    label: 'Unknown Whale #1',
    totalValueUsd: 45_000_000,
    tokenCount: 8,
    tier: 'large',
    firstSeen: Date.now() - 180 * 24 * 60 * 60 * 1000,
    lastActive: Date.now() - 30 * 60 * 1000,
    tags: ['trader', 'defi'],
    topHoldings: [
      {
        mint: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Wrapped SOL',
        amount: '200000000000000',
        uiAmount: 200000,
        valueUsd: 30_000_000,
        portfolioPercent: 66.7,
      },
    ],
  },
  {
    address: 'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq',
    label: 'Memecoin Degen',
    totalValueUsd: 8_500_000,
    tokenCount: 25,
    tier: 'medium',
    firstSeen: Date.now() - 90 * 24 * 60 * 60 * 1000,
    lastActive: Date.now() - 5 * 60 * 1000,
    tags: ['memecoin', 'degen', 'active'],
    topHoldings: [
      {
        mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        symbol: 'BONK',
        name: 'Bonk',
        amount: '50000000000000000',
        uiAmount: 50_000_000_000,
        valueUsd: 1_500_000,
        portfolioPercent: 17.6,
      },
    ],
  },
  {
    address: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    label: 'Institution Alpha',
    totalValueUsd: 250_000_000,
    tokenCount: 5,
    tier: 'mega',
    firstSeen: Date.now() - 400 * 24 * 60 * 60 * 1000,
    lastActive: Date.now() - 6 * 60 * 60 * 1000,
    tags: ['institution', 'long-term', 'sol-maximalist'],
    topHoldings: [
      {
        mint: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Wrapped SOL',
        amount: '1500000000000000',
        uiAmount: 1_500_000,
        valueUsd: 225_000_000,
        portfolioPercent: 90,
      },
    ],
  },
  {
    address: 'Fz6LxeUg5qjesYX3BdmtTwfAFREZvqsS5PHWWF5iRbj5',
    label: undefined,
    totalValueUsd: 12_000_000,
    tokenCount: 12,
    tier: 'medium',
    firstSeen: Date.now() - 60 * 24 * 60 * 60 * 1000,
    lastActive: Date.now() - 15 * 60 * 1000,
    tags: ['new-money', 'active'],
    topHoldings: [
      {
        mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
        symbol: 'JUP',
        name: 'Jupiter',
        amount: '10000000000000',
        uiAmount: 10_000_000,
        valueUsd: 8_000_000,
        portfolioPercent: 66.7,
      },
    ],
  },
];

// ============================================
// Mock Movements
// ============================================

export const mockMovements: Movement[] = [
  {
    txHash: '5UfDuX7hXvhbwQuQhKsYs1xKJ8VqM1R4uKiVXhWnfLVo7VdvPyGxWKYNTGPVsKUmvKAqJjBvVqYpYi3u7YQBHQJN',
    slot: 245_000_000,
    timestamp: Date.now() - 5 * 60 * 1000,
    wallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    tokenMint: 'So11111111111111111111111111111111111111112',
    tokenSymbol: 'SOL',
    type: 'buy',
    amount: 50_000,
    valueUsd: 7_500_000,
    significance: 95,
    protocol: 'Jupiter',
  },
  {
    txHash: '3KfDuX7hXvhbwQuQhKsYs1xKJ8VqM1R4uKiVXhWnfLVo7VdvPyGxWKYNTGPVsKUmvKAqJjBvVqYpYi3u7YQBHQJM',
    slot: 244_999_500,
    timestamp: Date.now() - 15 * 60 * 1000,
    wallet: 'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq',
    tokenMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    tokenSymbol: 'BONK',
    type: 'buy',
    amount: 10_000_000_000,
    valueUsd: 300_000,
    significance: 72,
    protocol: 'Raydium',
  },
  {
    txHash: '2JfDuX7hXvhbwQuQhKsYs1xKJ8VqM1R4uKiVXhWnfLVo7VdvPyGxWKYNTGPVsKUmvKAqJjBvVqYpYi3u7YQBHQJL',
    slot: 244_998_000,
    timestamp: Date.now() - 30 * 60 * 1000,
    wallet: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    tokenMint: 'So11111111111111111111111111111111111111112',
    tokenSymbol: 'SOL',
    type: 'transfer_in',
    amount: 100_000,
    valueUsd: 15_000_000,
    significance: 98,
  },
  {
    txHash: '1HfDuX7hXvhbwQuQhKsYs1xKJ8VqM1R4uKiVXhWnfLVo7VdvPyGxWKYNTGPVsKUmvKAqJjBvVqYpYi3u7YQBHQJK',
    slot: 244_995_000,
    timestamp: Date.now() - 60 * 60 * 1000,
    wallet: 'Fz6LxeUg5qjesYX3BdmtTwfAFREZvqsS5PHWWF5iRbj5',
    tokenMint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    tokenSymbol: 'JUP',
    type: 'buy',
    amount: 2_000_000,
    valueUsd: 1_600_000,
    significance: 85,
    protocol: 'Jupiter',
  },
  {
    txHash: '8GfDuX7hXvhbwQuQhKsYs1xKJ8VqM1R4uKiVXhWnfLVo7VdvPyGxWKYNTGPVsKUmvKAqJjBvVqYpYi3u7YQBHQJI',
    slot: 244_990_000,
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    wallet: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
    tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenSymbol: 'USDC',
    type: 'sell',
    amount: 5_000_000,
    valueUsd: 5_000_000,
    significance: 88,
    protocol: 'Raydium',
  },
];

// ============================================
// Mock Signals
// ============================================

export const mockSignals: Signal[] = [
  {
    id: 'sig_001',
    type: 'accumulation',
    wallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    tokenMint: 'So11111111111111111111111111111111111111112',
    tokenSymbol: 'SOL',
    strength: 92,
    confidence: 87,
    description: 'Large whale accumulating SOL aggressively over past 24h. 3 separate buys totaling $15M.',
    detectedAt: Date.now() - 10 * 60 * 1000,
    evidence: [
      {
        type: 'transaction',
        description: 'Buy $7.5M SOL via Jupiter',
        reference: '5UfDuX7hXvhbwQuQhKsYs1xKJ8VqM1R4uKiVXhWnfLVo7VdvPyGxWKYNTGPVsKUmvKAqJjBvVqYpYi3u7YQBHQJN',
      },
      {
        type: 'pattern',
        description: 'DCA pattern detected - buys at regular intervals',
      },
      {
        type: 'timing',
        description: 'Buying during low volume periods to minimize slippage',
      },
    ],
  },
  {
    id: 'sig_002',
    type: 'new_position',
    wallet: 'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq',
    tokenMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    tokenSymbol: 'BONK',
    strength: 68,
    confidence: 91,
    description: 'Known memecoin trader opened new BONK position worth $300K.',
    detectedAt: Date.now() - 20 * 60 * 1000,
    evidence: [
      {
        type: 'transaction',
        description: 'First BONK purchase by this wallet',
        reference: '3KfDuX7hXvhbwQuQhKsYs1xKJ8VqM1R4uKiVXhWnfLVo7VdvPyGxWKYNTGPVsKUmvKAqJjBvVqYpYi3u7YQBHQJM',
      },
      {
        type: 'pattern',
        description: 'Wallet has 78% win rate on memecoin trades',
      },
    ],
  },
  {
    id: 'sig_003',
    type: 'unusual_activity',
    wallet: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    tokenMint: 'So11111111111111111111111111111111111111112',
    tokenSymbol: 'SOL',
    strength: 96,
    confidence: 95,
    description: 'Mega whale received 100K SOL ($15M) from unknown source. Possible OTC deal or exchange withdrawal.',
    detectedAt: Date.now() - 35 * 60 * 1000,
    evidence: [
      {
        type: 'transaction',
        description: 'Large transfer from unlabeled wallet',
        reference: '2JfDuX7hXvhbwQuQhKsYs1xKJ8VqM1R4uKiVXhWnfLVo7VdvPyGxWKYNTGPVsKUmvKAqJjBvVqYpYi3u7YQBHQJL',
      },
      {
        type: 'volume',
        description: 'Transfer represents 0.05% of daily SOL volume',
      },
    ],
  },
  {
    id: 'sig_004',
    type: 'accumulation',
    wallet: 'Fz6LxeUg5qjesYX3BdmtTwfAFREZvqsS5PHWWF5iRbj5',
    tokenMint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    tokenSymbol: 'JUP',
    strength: 78,
    confidence: 82,
    description: 'Active trader building large JUP position. 5 buys in past 48h totaling $4M.',
    detectedAt: Date.now() - 65 * 60 * 1000,
    evidence: [
      {
        type: 'pattern',
        description: 'Consistent buying regardless of short-term price action',
      },
      {
        type: 'volume',
        description: 'Represents 2% of JUP daily volume',
      },
    ],
  },
  {
    id: 'sig_005',
    type: 'distribution',
    wallet: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
    tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenSymbol: 'USDC',
    strength: 65,
    confidence: 75,
    description: 'Raydium authority selling USDC for SOL. Could indicate protocol rebalancing or bullish SOL sentiment.',
    detectedAt: Date.now() - 125 * 60 * 1000,
    evidence: [
      {
        type: 'transaction',
        description: '$5M USDC sold via Raydium',
        reference: '8GfDuX7hXvhbwQuQhKsYs1xKJ8VqM1R4uKiVXhWnfLVo7VdvPyGxWKYNTGPVsKUmvKAqJjBvVqYpYi3u7YQBHQJI',
      },
    ],
  },
];

// ============================================
// Helper Functions
// ============================================

export function getWhaleByAddress(address: string): Whale | undefined {
  return mockWhales.find(w => w.address === address);
}

export function getMovementsByWallet(wallet: string): Movement[] {
  return mockMovements.filter(m => m.wallet === wallet);
}

export function getMovementByTxHash(txHash: string): Movement | undefined {
  return mockMovements.find(m => m.txHash === txHash);
}

export function getSignalsByWallet(wallet: string): Signal[] {
  return mockSignals.filter(s => s.wallet === wallet);
}

export function getWhalesByToken(tokenMint: string): Whale[] {
  return mockWhales.filter(w => 
    w.topHoldings.some(h => h.mint === tokenMint)
  );
}
