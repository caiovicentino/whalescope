/**
 * WhaleScope API Types
 * Common types for request/response handling
 */

// ============================================
// Whale Types
// ============================================

export interface Whale {
  /** Wallet address (base58) */
  address: string;
  /** Human-readable label if known */
  label?: string;
  /** Total portfolio value in USD */
  totalValueUsd: number;
  /** Number of tokens held */
  tokenCount: number;
  /** Top holdings */
  topHoldings: TokenHolding[];
  /** First seen timestamp */
  firstSeen: number;
  /** Last active timestamp */
  lastActive: number;
  /** Whale tier based on portfolio size */
  tier: 'mega' | 'large' | 'medium';
  /** Tags for categorization */
  tags: string[];
}

export interface TokenHolding {
  /** Token mint address */
  mint: string;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Amount held (raw) */
  amount: string;
  /** Amount held (UI decimals) */
  uiAmount: number;
  /** Current value in USD */
  valueUsd: number;
  /** Percentage of whale's portfolio */
  portfolioPercent: number;
}

export interface WhaleListResponse {
  whales: Whale[];
  pagination: PaginationMeta;
}

export interface WhaleDetailResponse {
  whale: Whale;
  recentMovements: Movement[];
  signals: Signal[];
}

// ============================================
// Movement Types
// ============================================

export interface Movement {
  /** Transaction hash */
  txHash: string;
  /** Block number */
  slot: number;
  /** Timestamp */
  timestamp: number;
  /** Wallet address */
  wallet: string;
  /** Token mint address */
  tokenMint: string;
  /** Token symbol */
  tokenSymbol: string;
  /** Movement type */
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
  /** Amount (UI decimals) */
  amount: number;
  /** Value in USD at time of transaction */
  valueUsd: number;
  /** Significance score (0-100) */
  significance: number;
  /** Related DEX/protocol if applicable */
  protocol?: string;
}

export interface MovementListResponse {
  movements: Movement[];
  pagination: PaginationMeta;
}

export interface MovementDetailResponse {
  movement: Movement;
  whale?: Whale;
  relatedMovements: Movement[];
}

// ============================================
// Signal Types
// ============================================

export interface Signal {
  /** Unique signal ID */
  id: string;
  /** Signal type */
  type: 'accumulation' | 'distribution' | 'new_position' | 'exit' | 'unusual_activity';
  /** Wallet address */
  wallet: string;
  /** Token mint address */
  tokenMint: string;
  /** Token symbol */
  tokenSymbol: string;
  /** Signal strength (0-100) */
  strength: number;
  /** Confidence level (0-100) */
  confidence: number;
  /** Human-readable description */
  description: string;
  /** When signal was detected */
  detectedAt: number;
  /** Supporting data points */
  evidence: SignalEvidence[];
}

export interface SignalEvidence {
  /** Type of evidence */
  type: 'transaction' | 'pattern' | 'volume' | 'timing';
  /** Description */
  description: string;
  /** Reference (tx hash, etc) */
  reference?: string;
}

export interface SignalListResponse {
  signals: Signal[];
  pagination: PaginationMeta;
}

// ============================================
// Common Types
// ============================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  version: string;
  services: {
    database: 'up' | 'down';
    rpc: 'up' | 'down';
    indexer: 'up' | 'down';
  };
}

// ============================================
// Request Params
// ============================================

export interface WhaleQueryParams extends PaginationQuery {
  /** Filter by minimum portfolio value */
  minValue?: number;
  /** Filter by tier */
  tier?: 'mega' | 'large' | 'medium';
  /** Filter by tag */
  tag?: string;
  /** Sort field */
  sortBy?: 'totalValueUsd' | 'lastActive' | 'tokenCount';
  /** Sort direction */
  sortDir?: 'asc' | 'desc';
}

export interface MovementQueryParams extends PaginationQuery {
  /** Filter by wallet address */
  wallet?: string;
  /** Filter by token mint */
  tokenMint?: string;
  /** Filter by movement type */
  type?: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
  /** Minimum value in USD */
  minValue?: number;
  /** From timestamp */
  from?: number;
  /** To timestamp */
  to?: number;
}

export interface SignalQueryParams extends PaginationQuery {
  /** Filter by signal type */
  type?: Signal['type'];
  /** Filter by token mint */
  tokenMint?: string;
  /** Minimum strength */
  minStrength?: number;
  /** From timestamp */
  from?: number;
}
