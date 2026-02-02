// WhaleScope Type Definitions

export interface Whale {
  address: string;
  label?: string;
  totalValueUsd: number;
  lastActivity: Date;
  tags: string[];
  tier?: 'mega' | 'large' | 'medium';
  tokenCount?: number;
  topHoldings?: TokenHolding[];
  firstSeen?: Date;
  lastActive?: Date;
}

export interface TokenHolding {
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  decimals: number;
  valueUsd: number;
  priceUsd: number;
}

export interface TokenHolder {
  address: string;
  mint?: string;
  amount: number;
  decimals: number;
  uiAmount: number;
}

export type TransactionType = 'swap' | 'transfer' | 'stake' | 'unstake' | 'mint' | 'burn' | 'unknown';

export interface Movement {
  id: string;
  whale: string;
  whaleAddress?: string;
  type: TransactionType;
  signature: string;
  timestamp: Date | number;
  tokens: MovementToken[];
  valueUsd: number;
  usdValue?: number;
  tokenMint?: string;
  direction?: 'in' | 'out';
  fromAddress?: string;
  toAddress?: string;
}

export interface MovementToken {
  mint: string;
  symbol: string;
  amount: number;
  direction: 'in' | 'out';
  valueUsd: number;
}

export interface WhaleAlert {
  id: string;
  whale: string;
  movement: Movement;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: Date;
}

export interface WhaleSummary {
  address: string;
  label?: string;
  holdings: TokenHolding[];
  totalValueUsd: number;
  recentMovements: Movement[];
  topTokens: TokenHolding[];
}

export interface ParsedTransaction {
  signature: string;
  timestamp: number;
  type: TransactionType;
  source: string;
  fee: number;
  success: boolean;
  tokenIn?: TokenHolder;
  tokenOut?: TokenHolder;
  transfer?: TokenHolder;
}

export interface TokenTransfer {
  mint: string;
  amount: number;
  fromAddress: string;
  toAddress: string;
}

export interface WhaleProfile {
  address: string;
  label?: string;
  tier: 'mega' | 'large' | 'medium';
  totalValueUsd: number;
  tokenCount: number;
  topHoldings: TokenHolding[];
  tags: string[];
  firstSeen: Date;
  lastActive: Date;
}

export interface WhaleBehavior {
  pattern: Pattern;
  confidence: number;
  evidence: string[];
}

export type Pattern = 'accumulating' | 'distributing' | 'holding' | 'trading';

export interface WhaleConfig {
  minValueUsd: number;
  alertThresholdUsd: number;
  minMovementUsd?: number;
}

export type WhaleMovement = Movement;

// Helius types
export interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  nativeTransfers: HeliusNativeTransfer[];
  tokenTransfers: HeliusTokenTransfer[];
}

export interface HeliusEnhancedTransaction {
  signature: string;
  timestamp: number;
  type?: string;
  source?: string;
  fee: number;
  feePayer?: string;
  nativeTransfers?: HeliusNativeTransfer[];
  tokenTransfers?: HeliusTokenTransfer[];
}

export interface HeliusNativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

export interface HeliusTokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  mint: string;
  tokenAmount: number;
}
