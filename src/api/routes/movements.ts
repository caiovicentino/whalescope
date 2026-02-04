/**
 * WhaleScope API - Movement Routes
 * 
 * @description Endpoints for tracking large token movements
 * Uses REAL blockchain data via Helius API when available
 */

import { Router, Request, Response } from 'express';
import type { 
  MovementListResponse, 
  MovementDetailResponse, 
  MovementQueryParams,
  PaginationMeta,
  ApiError,
  Movement
} from '../../types/api';
import { config } from '../../config';
import { getRecentTransactions } from '../../services/helius';
import { 
  mockMovements, 
  getMovementByTxHash,
  getWhaleByAddress,
  mockWhales
} from '../mockData';

const router = Router();

// Check if we have real API access
const hasRealApi = () => Boolean(config.heliusApiKey);

// Known whale addresses for tracking
const getTrackedAddresses = () => mockWhales.map(w => w.address);

// Token prices (simplified - in production, use CoinGecko/Birdeye)
const TOKEN_PRICES: Record<string, number> = {
  'So11111111111111111111111111111111111111112': 150, // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1,  // USDC
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 0.80, // JUP
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 0.00003, // BONK
};

/**
 * Parse Helius transaction into Movement format
 */
function parseTransaction(tx: any, wallet: string): Movement | null {
  const transfers = tx.tokenTransfers || [];
  const nativeTransfers = tx.nativeTransfers || [];
  
  // Determine movement type
  let type: Movement['type'] = 'transfer_in';
  let amount = 0;
  let tokenMint = 'So11111111111111111111111111111111111111112';
  let tokenSymbol = 'SOL';

  if (tx.type?.toUpperCase().includes('SWAP')) {
    // Swap transaction
    const incoming = transfers.find((t: any) => t.toUserAccount === wallet);
    const outgoing = transfers.find((t: any) => t.fromUserAccount === wallet);
    
    if (incoming && outgoing) {
      // Net buy/sell based on which is bigger
      type = incoming.tokenAmount > outgoing.tokenAmount ? 'buy' : 'sell';
      amount = Math.max(incoming.tokenAmount, outgoing.tokenAmount);
      tokenMint = type === 'buy' ? incoming.mint : outgoing.mint;
    }
  } else if (transfers.length > 0) {
    // Simple transfer
    const transfer = transfers[0];
    type = transfer.toUserAccount === wallet ? 'transfer_in' : 'transfer_out';
    amount = transfer.tokenAmount;
    tokenMint = transfer.mint;
  } else if (nativeTransfers.length > 0) {
    // Native SOL transfer
    const transfer = nativeTransfers[0];
    type = transfer.toUserAccount === wallet ? 'transfer_in' : 'transfer_out';
    amount = transfer.amount / 1e9; // Convert lamports to SOL
  }

  const price = TOKEN_PRICES[tokenMint] || 1;
  const valueUsd = amount * price;

  // Only include significant movements
  if (valueUsd < 10000) return null;

  return {
    txHash: tx.signature,
    slot: tx.slot || 0,
    timestamp: tx.timestamp * 1000,
    wallet,
    tokenMint,
    tokenSymbol: tokenMint.slice(0, 4).toUpperCase(),
    type,
    amount,
    valueUsd,
    significance: Math.min(100, Math.floor(valueUsd / 10000)),
    protocol: tx.source || undefined,
  };
}

/**
 * @openapi
 * /api/movements:
 *   get:
 *     summary: List recent large movements
 */
router.get('/', async (req: Request<{}, MovementListResponse, {}, MovementQueryParams>, res: Response<MovementListResponse>) => {
  const {
    page = 1,
    limit = 20,
    wallet,
    tokenMint,
    type,
    minValue,
    from,
    to
  } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  try {
    let movements: Movement[];

    if (hasRealApi()) {
      console.log('📡 Fetching REAL movement data from Helius...');
      
      const allMovements: Movement[] = [];
      const addressesToTrack = wallet ? [wallet as string] : getTrackedAddresses().slice(0, 5);

      for (const address of addressesToTrack) {
        try {
          const transactions = await getRecentTransactions(address, 20);
          
          for (const tx of transactions) {
            const movement = parseTransaction(tx, address);
            if (movement) {
              allMovements.push(movement);
            }
          }
        } catch (err) {
          console.error(`Error fetching transactions for ${address.slice(0, 8)}:`, err);
        }
      }

      movements = allMovements;
      console.log(`✅ Found ${movements.length} real movements`);
    } else {
      console.warn('⚠️ Using MOCK data - set HELIUS_API_KEY for real data');
      movements = [...mockMovements];
    }

    // Apply filters
    if (wallet) {
      movements = movements.filter(m => m.wallet === wallet);
    }
    if (tokenMint) {
      movements = movements.filter(m => m.tokenMint === tokenMint);
    }
    if (type) {
      movements = movements.filter(m => m.type === type);
    }
    if (minValue) {
      movements = movements.filter(m => m.valueUsd >= Number(minValue));
    }
    if (from) {
      movements = movements.filter(m => m.timestamp >= Number(from));
    }
    if (to) {
      movements = movements.filter(m => m.timestamp <= Number(to));
    }

    // Sort by timestamp (most recent first)
    movements.sort((a, b) => b.timestamp - a.timestamp);

    // Paginate
    const total = movements.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIdx = (pageNum - 1) * limitNum;
    const paginatedMovements = movements.slice(startIdx, startIdx + limitNum);

    const pagination: PaginationMeta = {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    };

    res.json({ 
      movements: paginatedMovements, 
      pagination,
      _meta: { dataSource: hasRealApi() ? 'helius' : 'mock', timestamp: Date.now() }
    } as any);
  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch movements',
      statusCode: 500
    } as any);
  }
});

/**
 * @openapi
 * /api/movements/{txHash}:
 *   get:
 *     summary: Get movement details
 */
router.get('/:txHash', async (req: Request<{ txHash: string }>, res: Response<MovementDetailResponse | ApiError>) => {
  const { txHash } = req.params;

  try {
    // Try mock first (for known transactions)
    const movement = getMovementByTxHash(txHash);

    if (!movement) {
      // In production with real API, we'd fetch the specific transaction
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `Movement with txHash ${txHash} not found`,
        statusCode: 404
      });
      return;
    }

    const whale = getWhaleByAddress(movement.wallet);
    const relatedMovements = mockMovements.filter(m => 
      m.txHash !== txHash &&
      m.wallet === movement.wallet &&
      m.tokenMint === movement.tokenMint &&
      Math.abs(m.timestamp - movement.timestamp) < 24 * 60 * 60 * 1000
    ).slice(0, 5);

    res.json({
      movement,
      whale,
      relatedMovements,
      _meta: { dataSource: 'mock', timestamp: Date.now() }
    } as any);
  } catch (error) {
    console.error('Error fetching movement details:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch movement details',
      statusCode: 500
    });
  }
});

export default router;
