/**
 * WhaleScope API - Movement Routes
 * 
 * @description Endpoints for tracking large token movements
 */

import { Router, Request, Response } from 'express';
import type { 
  MovementListResponse, 
  MovementDetailResponse, 
  MovementQueryParams,
  PaginationMeta,
  ApiError 
} from '../../types/api';
import { 
  mockMovements, 
  getMovementByTxHash,
  getWhaleByAddress 
} from '../mockData';

const router = Router();

/**
 * @openapi
 * /api/movements:
 *   get:
 *     summary: List recent large movements
 *     description: Returns a paginated list of significant token movements by tracked whales
 *     tags:
 *       - Movements
 *     parameters:
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
 *       - name: wallet
 *         in: query
 *         description: Filter by wallet address
 *         schema:
 *           type: string
 *       - name: tokenMint
 *         in: query
 *         description: Filter by token mint address
 *         schema:
 *           type: string
 *       - name: type
 *         in: query
 *         description: Filter by movement type
 *         schema:
 *           type: string
 *           enum: [buy, sell, transfer_in, transfer_out]
 *       - name: minValue
 *         in: query
 *         description: Minimum value in USD
 *         schema:
 *           type: number
 *       - name: from
 *         in: query
 *         description: From timestamp (unix ms)
 *         schema:
 *           type: integer
 *       - name: to
 *         in: query
 *         description: To timestamp (unix ms)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of movements
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MovementListResponse'
 */
router.get('/', (req: Request<{}, MovementListResponse, {}, MovementQueryParams>, res: Response<MovementListResponse>) => {
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

  // Filter movements
  let filtered = [...mockMovements];

  if (wallet) {
    filtered = filtered.filter(m => m.wallet === wallet);
  }

  if (tokenMint) {
    filtered = filtered.filter(m => m.tokenMint === tokenMint);
  }

  if (type) {
    filtered = filtered.filter(m => m.type === type);
  }

  if (minValue) {
    filtered = filtered.filter(m => m.valueUsd >= Number(minValue));
  }

  if (from) {
    filtered = filtered.filter(m => m.timestamp >= Number(from));
  }

  if (to) {
    filtered = filtered.filter(m => m.timestamp <= Number(to));
  }

  // Sort by timestamp (most recent first)
  filtered.sort((a, b) => b.timestamp - a.timestamp);

  // Paginate
  const total = filtered.length;
  const totalPages = Math.ceil(total / limitNum);
  const startIdx = (pageNum - 1) * limitNum;
  const movements = filtered.slice(startIdx, startIdx + limitNum);

  const pagination: PaginationMeta = {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages,
    hasNext: pageNum < totalPages,
    hasPrev: pageNum > 1
  };

  res.json({ movements, pagination });
});

/**
 * @openapi
 * /api/movements/{txHash}:
 *   get:
 *     summary: Get movement details
 *     description: Returns detailed information about a specific movement/transaction
 *     tags:
 *       - Movements
 *     parameters:
 *       - name: txHash
 *         in: path
 *         required: true
 *         description: Transaction hash (signature)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movement details with related data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MovementDetailResponse'
 *       404:
 *         description: Movement not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/:txHash', (req: Request<{ txHash: string }>, res: Response<MovementDetailResponse | ApiError>) => {
  const { txHash } = req.params;

  const movement = getMovementByTxHash(txHash);

  if (!movement) {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: `Movement with txHash ${txHash} not found`,
      statusCode: 404
    });
    return;
  }

  // Get whale info if available
  const whale = getWhaleByAddress(movement.wallet);

  // Get related movements (same wallet, same token, within 24h)
  const relatedMovements = mockMovements.filter(m => 
    m.txHash !== txHash &&
    m.wallet === movement.wallet &&
    m.tokenMint === movement.tokenMint &&
    Math.abs(m.timestamp - movement.timestamp) < 24 * 60 * 60 * 1000
  ).slice(0, 5);

  res.json({
    movement,
    whale,
    relatedMovements
  });
});

export default router;
