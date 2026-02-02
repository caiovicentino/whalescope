/**
 * WhaleScope API - Whale Routes
 * 
 * @description Endpoints for whale data and analytics
 */

import { Router, Request, Response } from 'express';
import type { 
  WhaleListResponse, 
  WhaleDetailResponse, 
  WhaleQueryParams,
  PaginationMeta,
  ApiError 
} from '../../types/api';
import { 
  mockWhales, 
  getWhaleByAddress, 
  getMovementsByWallet,
  getSignalsByWallet,
  getWhalesByToken 
} from '../mockData';

const router = Router();

/**
 * @openapi
 * /api/whales:
 *   get:
 *     summary: List top whales
 *     description: Returns a paginated list of tracked whale wallets, sorted by portfolio value
 *     tags:
 *       - Whales
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number (1-indexed)
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Items per page (max 100)
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: minValue
 *         in: query
 *         description: Minimum portfolio value in USD
 *         schema:
 *           type: number
 *       - name: tier
 *         in: query
 *         description: Filter by whale tier
 *         schema:
 *           type: string
 *           enum: [mega, large, medium]
 *       - name: tag
 *         in: query
 *         description: Filter by tag
 *         schema:
 *           type: string
 *       - name: sortBy
 *         in: query
 *         description: Sort field
 *         schema:
 *           type: string
 *           enum: [totalValueUsd, lastActive, tokenCount]
 *           default: totalValueUsd
 *       - name: sortDir
 *         in: query
 *         description: Sort direction
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of whales
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WhaleListResponse'
 */
router.get('/', (req: Request<{}, WhaleListResponse, {}, WhaleQueryParams>, res: Response<WhaleListResponse>) => {
  const {
    page = 1,
    limit = 20,
    minValue,
    tier,
    tag,
    sortBy = 'totalValueUsd',
    sortDir = 'desc'
  } = req.query;

  // Parse pagination
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  // Filter whales
  let filtered = [...mockWhales];

  if (minValue) {
    filtered = filtered.filter(w => w.totalValueUsd >= Number(minValue));
  }

  if (tier) {
    filtered = filtered.filter(w => w.tier === tier);
  }

  if (tag) {
    filtered = filtered.filter(w => w.tags.includes(tag as string));
  }

  // Sort whales
  const sortField = sortBy as keyof typeof mockWhales[0];
  filtered.sort((a, b) => {
    const aVal = a[sortField] as number;
    const bVal = b[sortField] as number;
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Paginate
  const total = filtered.length;
  const totalPages = Math.ceil(total / limitNum);
  const startIdx = (pageNum - 1) * limitNum;
  const whales = filtered.slice(startIdx, startIdx + limitNum);

  const pagination: PaginationMeta = {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages,
    hasNext: pageNum < totalPages,
    hasPrev: pageNum > 1
  };

  res.json({ whales, pagination });
});

/**
 * @openapi
 * /api/whales/{address}:
 *   get:
 *     summary: Get whale details
 *     description: Returns detailed information about a specific whale wallet
 *     tags:
 *       - Whales
 *     parameters:
 *       - name: address
 *         in: path
 *         required: true
 *         description: Wallet address (base58)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Whale details with recent activity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WhaleDetailResponse'
 *       404:
 *         description: Whale not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/:address', (req: Request<{ address: string }>, res: Response<WhaleDetailResponse | ApiError>) => {
  const { address } = req.params;

  const whale = getWhaleByAddress(address);

  if (!whale) {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: `Whale with address ${address} not found`,
      statusCode: 404
    });
    return;
  }

  const recentMovements = getMovementsByWallet(address).slice(0, 10);
  const signals = getSignalsByWallet(address).slice(0, 5);

  res.json({
    whale,
    recentMovements,
    signals
  });
});

/**
 * @openapi
 * /api/tokens/{mint}/whales:
 *   get:
 *     summary: Get whales holding a specific token
 *     description: Returns whales that hold a significant position in the specified token
 *     tags:
 *       - Whales
 *       - Tokens
 *     parameters:
 *       - name: mint
 *         in: path
 *         required: true
 *         description: Token mint address
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of whales holding the token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WhaleListResponse'
 */
router.get('/tokens/:mint', (req: Request<{ mint: string }, WhaleListResponse, {}, WhaleQueryParams>, res: Response<WhaleListResponse>) => {
  const { mint } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const whales = getWhalesByToken(mint);
  
  // Sort by holding value in this token
  whales.sort((a, b) => {
    const aHolding = a.topHoldings.find(h => h.mint === mint);
    const bHolding = b.topHoldings.find(h => h.mint === mint);
    return (bHolding?.valueUsd || 0) - (aHolding?.valueUsd || 0);
  });

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

  res.json({ whales: paginatedWhales, pagination });
});

export default router;
