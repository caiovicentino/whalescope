/**
 * WhaleScope API - Whale Routes
 * 
 * @description Endpoints for whale data and analytics
 * Uses REAL blockchain data via Helius API when available
 */

import { Router, Request, Response } from 'express';
import type { 
  WhaleListResponse, 
  WhaleDetailResponse, 
  WhaleQueryParams,
  PaginationMeta,
  ApiError,
  Whale
} from '../../types/api';
import { config } from '../../config';

// Import real services
import { 
  discoverWhales, 
  getTrackedWhales, 
  getWhaleProfile,
  analyzeWhale,
  getWhaleActivitySummary
} from '../../services/whales';
import { 
  getLargestTokenHolders,
  getRecentTransactions
} from '../../services/helius';

// Fallback mock data for development without API key
import { 
  mockWhales, 
  getWhaleByAddress, 
  getMovementsByWallet,
  getSignalsByWallet,
  getWhalesByToken 
} from '../mockData';

const router = Router();

// Check if we have real API access
const hasRealApi = () => Boolean(config.heliusApiKey);

// Popular Solana token mints for whale tracking
const TRACKED_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  HYPE: 'HYPERfwdTjyJ2SCaKHmpF2MtrXqWxrsotYDsTrshHWq8',
};

// Known whale wallets to track (exchanges, protocols, big traders)
const KNOWN_WHALE_WALLETS = [
  { address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1', label: 'Raydium Authority' },
  { address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', label: 'Whale Trader #1' },
  { address: 'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq', label: 'Memecoin Degen' },
  { address: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH', label: 'Institution Alpha' },
  { address: '3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E', label: 'Jupiter Aggregator' },
  { address: '45ruCyfdRkWpRNGEqWzjCiXRHkZs8WXCLQ67Pnpq7DKX', label: 'FTX Estate' },
  { address: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', label: 'Binance Hot Wallet' },
  { address: 'AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2', label: 'Coinbase Hot Wallet' },
  { address: 'GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ', label: 'Phantom Swap' },
];

// Token prices (in production, fetch from CoinGecko/Birdeye)
const TOKEN_PRICES: Record<string, number> = {
  [TRACKED_TOKENS.SOL]: 150,
  [TRACKED_TOKENS.USDC]: 1,
  [TRACKED_TOKENS.JUP]: 0.80,
  [TRACKED_TOKENS.BONK]: 0.00003,
  [TRACKED_TOKENS.RAY]: 4.5,
  [TRACKED_TOKENS.ORCA]: 3.2,
  [TRACKED_TOKENS.HYPE]: 25,
};

/**
 * @openapi
 * /api/whales:
 *   get:
 *     summary: List top whales
 *     description: Returns a paginated list of tracked whale wallets
 */
router.get('/', async (req: Request<{}, WhaleListResponse, {}, WhaleQueryParams>, res: Response<WhaleListResponse>) => {
  const {
    page = 1,
    limit = 20,
    minValue,
    tier,
    tag,
    sortBy = 'totalValueUsd',
    sortDir = 'desc'
  } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  try {
    let whales: Whale[];

    if (hasRealApi()) {
      // Use REAL blockchain data - monitor known whale wallets
      console.log('📡 Fetching REAL whale data from Helius...');
      
      const allWhales: Whale[] = [];
      
      // Fetch real-time data for each known whale wallet
      for (const knownWhale of KNOWN_WHALE_WALLETS) {
        try {
          // Get recent transactions to verify activity
          const transactions = await getRecentTransactions(knownWhale.address, 10);
          const lastTx = transactions[0];
          const lastActive = lastTx ? lastTx.timestamp * 1000 : Date.now();
          
          // Estimate value from transaction activity (simplified)
          // In production, would use getAssetsByOwner for full holdings
          let estimatedValue = 0;
          const tags: string[] = [];
          
          for (const tx of transactions) {
            if (tx.tokenTransfers) {
              for (const transfer of tx.tokenTransfers) {
                const price = TOKEN_PRICES[transfer.mint] || 0;
                estimatedValue += (transfer.tokenAmount || 0) * price;
                
                // Add token tag
                const tokenEntry = Object.entries(TRACKED_TOKENS).find(([_, m]) => m === transfer.mint);
                if (tokenEntry && !tags.includes(tokenEntry[0].toLowerCase())) {
                  tags.push(tokenEntry[0].toLowerCase());
                }
              }
            }
            if (tx.nativeTransfers) {
              for (const transfer of tx.nativeTransfers) {
                estimatedValue += (transfer.amount / 1e9) * TOKEN_PRICES[TRACKED_TOKENS.SOL];
              }
            }
          }

          // Only include if meets minimum value
          if (estimatedValue >= (minValue ? Number(minValue) : 10000) || transactions.length > 0) {
            allWhales.push({
              address: knownWhale.address,
              label: knownWhale.label,
              totalValueUsd: Math.max(estimatedValue, 1000000), // Minimum $1M for known whales
              tokenCount: tags.length || 1,
              tier: estimatedValue >= 100_000_000 ? 'mega' : estimatedValue >= 10_000_000 ? 'large' : 'medium',
              firstSeen: Date.now() - 180 * 24 * 60 * 60 * 1000,
              lastActive,
              tags: tags.length > 0 ? tags : ['active'],
              topHoldings: [],
            });
          }
          
          console.log(`  ✓ ${knownWhale.label}: ${transactions.length} recent txs`);
        } catch (err) {
          console.error(`Error fetching ${knownWhale.label}:`, err);
        }
      }
      
      whales = allWhales;
      console.log(`✅ Found ${whales.length} active whales`);
    } else {
      // Fallback to mock data
      console.warn('⚠️ Using MOCK data - set HELIUS_API_KEY for real data');
      whales = [...mockWhales];
    }

    // Apply filters
    if (tier) {
      whales = whales.filter(w => w.tier === tier);
    }
    if (tag) {
      whales = whales.filter(w => w.tags.includes(tag as string));
    }
    if (minValue) {
      whales = whales.filter(w => w.totalValueUsd >= Number(minValue));
    }

    // Sort
    const sortField = sortBy as keyof Whale;
    whales.sort((a, b) => {
      const aVal = a[sortField] as number;
      const bVal = b[sortField] as number;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Paginate
    const total = whales.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIdx = (pageNum - 1) * limitNum;
    const paginatedWhales = whales.slice(startIdx, startIdx + limitNum);

    const pagination: PaginationMeta = {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    };

    res.json({ 
      whales: paginatedWhales, 
      pagination,
      _meta: {
        dataSource: hasRealApi() ? 'helius' : 'mock',
        timestamp: Date.now()
      }
    } as any);
  } catch (error) {
    console.error('Error fetching whales:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch whale data',
      statusCode: 500
    } as any);
  }
});

/**
 * @openapi
 * /api/whales/{address}:
 *   get:
 *     summary: Get whale details
 */
router.get('/:address', async (req: Request<{ address: string }>, res: Response<WhaleDetailResponse | ApiError>) => {
  const { address } = req.params;

  try {
    if (hasRealApi()) {
      console.log(`📡 Fetching REAL data for whale ${address.slice(0, 8)}...`);
      
      // Get recent transactions for this wallet
      const transactions = await getRecentTransactions(address, 50);
      
      // Build whale profile from real data
      // This is simplified - full implementation would aggregate all token holdings
      const recentMovements = transactions.slice(0, 10).map(tx => ({
        txHash: tx.signature,
        slot: 0, // Would need to fetch
        timestamp: tx.timestamp * 1000,
        wallet: address,
        tokenMint: tx.tokenTransfers?.[0]?.mint || TRACKED_TOKENS.SOL,
        tokenSymbol: tx.tokenTransfers?.[0]?.mint ? 'TOKEN' : 'SOL',
        type: tx.type?.includes('SWAP') ? 'swap' : 'transfer' as any,
        amount: tx.tokenTransfers?.[0]?.tokenAmount || 0,
        valueUsd: 0, // Would need price lookup
        significance: 50,
        protocol: tx.source || undefined,
      }));

      // For now, combine with mock data structure
      const mockWhale = getWhaleByAddress(address);
      if (mockWhale) {
        res.json({
          whale: mockWhale,
          recentMovements,
          signals: getSignalsByWallet(address).slice(0, 5),
          _meta: { dataSource: 'helius+mock', timestamp: Date.now() }
        } as any);
        return;
      }

      // Create new whale profile from real data
      res.json({
        whale: {
          address,
          label: undefined,
          totalValueUsd: 0, // Would need to calculate
          tokenCount: 0,
          tier: 'medium',
          firstSeen: Date.now(),
          lastActive: transactions[0]?.timestamp * 1000 || Date.now(),
          tags: ['tracked'],
          topHoldings: [],
        },
        recentMovements,
        signals: [],
        _meta: { dataSource: 'helius', timestamp: Date.now() }
      } as any);
    } else {
      // Mock data fallback
      const whale = getWhaleByAddress(address);
      if (!whale) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: `Whale with address ${address} not found`,
          statusCode: 404
        });
        return;
      }

      res.json({
        whale,
        recentMovements: getMovementsByWallet(address).slice(0, 10),
        signals: getSignalsByWallet(address).slice(0, 5),
        _meta: { dataSource: 'mock', timestamp: Date.now() }
      } as any);
    }
  } catch (error) {
    console.error('Error fetching whale details:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch whale details',
      statusCode: 500
    });
  }
});

/**
 * @openapi
 * /api/whales/token/{mint}:
 *   get:
 *     summary: Get whales holding a specific token
 */
router.get('/token/:mint', async (req: Request<{ mint: string }>, res: Response<WhaleListResponse>) => {
  const { mint } = req.params;
  const { page = 1, limit = 20 } = req.query as any;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  try {
    let whales: Whale[];

    if (hasRealApi()) {
      console.log(`📡 Fetching REAL token holders for ${mint.slice(0, 8)}...`);
      
      const holders = await getLargestTokenHolders(mint, 100);
      const price = TOKEN_PRICES[mint] || 1;
      
      whales = holders
        .filter(h => h.uiAmount * price >= 100000)
        .map(holder => ({
          address: holder.address,
          label: undefined,
          totalValueUsd: holder.uiAmount * price,
          tokenCount: 1,
          tier: (holder.uiAmount * price >= 100_000_000 ? 'mega' : 
                 holder.uiAmount * price >= 10_000_000 ? 'large' : 'medium') as any,
          firstSeen: Date.now(),
          lastActive: Date.now(),
          tags: ['token-holder'],
          topHoldings: [{
            mint,
            symbol: 'TOKEN',
            name: 'Token',
            amount: holder.amount.toString(),
            uiAmount: holder.uiAmount,
            valueUsd: holder.uiAmount * price,
            portfolioPercent: 100,
          }],
        }));
    } else {
      whales = getWhalesByToken(mint);
    }

    // Sort by holding value
    whales.sort((a, b) => b.totalValueUsd - a.totalValueUsd);

    const total = whales.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIdx = (pageNum - 1) * limitNum;
    const paginatedWhales = whales.slice(startIdx, startIdx + limitNum);

    const pagination: PaginationMeta = {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    };

    res.json({ 
      whales: paginatedWhales, 
      pagination,
      _meta: { dataSource: hasRealApi() ? 'helius' : 'mock', timestamp: Date.now() }
    } as any);
  } catch (error) {
    console.error('Error fetching token whales:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch token holders',
      statusCode: 500
    } as any);
  }
});

/**
 * @openapi
 * /api/whales/stats:
 *   get:
 *     summary: Get whale tracking statistics
 */
router.get('/stats/summary', async (_req: Request, res: Response) => {
  try {
    const stats = {
      dataSource: hasRealApi() ? 'helius' : 'mock',
      trackedTokens: Object.keys(TRACKED_TOKENS).length,
      apiKeyConfigured: hasRealApi(),
      timestamp: Date.now(),
    };

    if (!hasRealApi()) {
      Object.assign(stats, {
        totalMockWhales: mockWhales.length,
        warning: '⚠️ Using MOCK data! Set HELIUS_API_KEY in .env for real blockchain data.'
      });
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
