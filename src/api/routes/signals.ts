/**
 * WhaleScope API - Signal Routes
 * 
 * @description Endpoints for accumulation/distribution signals and alerts
 */

import { Router, Request, Response } from 'express';
import type { 
  SignalListResponse, 
  Signal,
  SignalQueryParams,
  PaginationMeta
} from '../../types/api';
import { 
  mockSignals, 
  getSignalsByWallet,
  getWhaleByAddress 
} from '../mockData';

const router = Router();

/**
 * @openapi
 * /api/signals:
 *   get:
 *     summary: List recent signals
 *     description: Returns a paginated list of detected accumulation/distribution signals
 *     tags:
 *       - Signals
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
 *       - name: type
 *         in: query
 *         description: Filter by signal type
 *         schema:
 *           type: string
 *           enum: [accumulation, distribution, new_position, exit, unusual_activity]
 *       - name: tokenMint
 *         in: query
 *         description: Filter by token mint address
 *         schema:
 *           type: string
 *       - name: minStrength
 *         in: query
 *         description: Minimum signal strength (0-100)
 *         schema:
 *           type: integer
 *       - name: from
 *         in: query
 *         description: From timestamp (unix ms)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of signals
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SignalListResponse'
 */
router.get('/', (req: Request<{}, SignalListResponse, {}, SignalQueryParams>, res: Response<SignalListResponse>) => {
  const {
    page = 1,
    limit = 20,
    type,
    tokenMint,
    minStrength,
    from
  } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  // Filter signals
  let filtered = [...mockSignals];

  if (type) {
    filtered = filtered.filter(s => s.type === type);
  }

  if (tokenMint) {
    filtered = filtered.filter(s => s.tokenMint === tokenMint);
  }

  if (minStrength) {
    filtered = filtered.filter(s => s.strength >= Number(minStrength));
  }

  if (from) {
    filtered = filtered.filter(s => s.detectedAt >= Number(from));
  }

  // Sort by detection time (most recent first)
  filtered.sort((a, b) => b.detectedAt - a.detectedAt);

  // Paginate
  const total = filtered.length;
  const totalPages = Math.ceil(total / limitNum);
  const startIdx = (pageNum - 1) * limitNum;
  const signals = filtered.slice(startIdx, startIdx + limitNum);

  const pagination: PaginationMeta = {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages,
    hasNext: pageNum < totalPages,
    hasPrev: pageNum > 1
  };

  res.json({ signals, pagination });
});

/**
 * @openapi
 * /api/signals/{address}:
 *   get:
 *     summary: Get signals for a specific wallet
 *     description: Returns all signals associated with a specific whale wallet
 *     tags:
 *       - Signals
 *     parameters:
 *       - name: address
 *         in: path
 *         required: true
 *         description: Wallet address (base58)
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
 *       - name: type
 *         in: query
 *         description: Filter by signal type
 *         schema:
 *           type: string
 *           enum: [accumulation, distribution, new_position, exit, unusual_activity]
 *     responses:
 *       200:
 *         description: Signals for the wallet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallet:
 *                   type: string
 *                 label:
 *                   type: string
 *                 signals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Signal'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
interface WalletSignalsResponse {
  wallet: string;
  label?: string;
  signals: Signal[];
  pagination: PaginationMeta;
}

router.get('/:address', (req: Request<{ address: string }, WalletSignalsResponse, {}, SignalQueryParams>, res: Response<WalletSignalsResponse>) => {
  const { address } = req.params;
  const { page = 1, limit = 20, type } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  // Get whale info for label
  const whale = getWhaleByAddress(address);

  // Get signals for wallet
  let signals = getSignalsByWallet(address);

  if (type) {
    signals = signals.filter(s => s.type === type);
  }

  // Sort by detection time
  signals.sort((a, b) => b.detectedAt - a.detectedAt);

  // Paginate
  const total = signals.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const startIdx = (pageNum - 1) * limitNum;
  const paginatedSignals = signals.slice(startIdx, startIdx + limitNum);

  const pagination: PaginationMeta = {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages,
    hasNext: pageNum < totalPages,
    hasPrev: pageNum > 1
  };

  res.json({
    wallet: address,
    label: whale?.label,
    signals: paginatedSignals,
    pagination
  });
});

export default router;
