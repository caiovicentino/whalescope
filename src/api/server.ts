/**
 * WhaleScope API Server
 * 
 * @description Express server with CORS, error handling, and all API routes
 * @version 1.0.0
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import type { HealthResponse } from '../types/api';

// Import routes
import whalesRouter from './routes/whales';
import movementsRouter from './routes/movements';
import signalsRouter from './routes/signals';

// ============================================
// Server Configuration
// ============================================

export interface ServerConfig {
  /** Port to listen on */
  port: number;
  /** CORS origin (default: '*') */
  corsOrigin?: string | string[];
  /** Enable request logging */
  enableLogging?: boolean;
}

const DEFAULT_CONFIG: ServerConfig = {
  port: 3000,
  corsOrigin: '*',
  enableLogging: true
};

// ============================================
// Server Class
// ============================================

export class WhalescopeServer {
  private app: Express;
  private config: ServerConfig;
  private startTime: number = Date.now();

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware stack
   */
  private setupMiddleware(): void {
    // CORS
    this.app.use(cors({
      origin: this.config.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      credentials: true
    }));

    // JSON body parser
    this.app.use(express.json({ limit: '1mb' }));

    // URL encoded parser
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    if (this.config.enableLogging) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        res.on('finish', () => {
          const duration = Date.now() - start;
          console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
        });
        next();
      });
    }

    // Request ID header
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', requestId);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    /**
     * @openapi
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     description: Returns server health status and service availability
     *     tags:
     *       - System
     *     responses:
     *       200:
     *         description: Server is healthy
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HealthResponse'
     */
    this.app.get('/health', (_req: Request, res: Response<HealthResponse>) => {
      res.json({
        status: 'healthy',
        timestamp: Date.now(),
        version: '1.0.0',
        services: {
          database: 'up', // TODO: Add real health checks
          rpc: 'up',
          indexer: 'up'
        }
      });
    });

    /**
     * @openapi
     * /:
     *   get:
     *     summary: API info
     *     description: Returns basic API information
     *     tags:
     *       - System
     */
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'WhaleScope API',
        version: '1.0.0',
        description: 'Real-time whale tracking and signal detection for Solana',
        docs: '/api/docs',
        endpoints: {
          whales: '/api/whales',
          movements: '/api/movements',
          signals: '/api/signals',
          health: '/health'
        },
        uptime: Math.floor((Date.now() - this.startTime) / 1000)
      });
    });

    // Mount API routes
    this.app.use('/api/whales', whalesRouter);
    this.app.use('/api/tokens', whalesRouter); // Token routes are in whales router
    this.app.use('/api/movements', movementsRouter);
    this.app.use('/api/signals', signalsRouter);

    // 404 handler for unmatched routes
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
        statusCode: 404
      });
    });
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
      console.error(`[ERROR] ${req.method} ${req.path}:`, err);

      // Handle known error types
      if (err.name === 'SyntaxError' && 'body' in err) {
        res.status(400).json({
          error: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
          statusCode: 400
        });
        return;
      }

      if (err.name === 'ValidationError') {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: err.message,
          statusCode: 400
        });
        return;
      }

      // Default 500 error
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : err.message,
        statusCode: 500
      });
    });
  }

  /**
   * Start the server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        this.startTime = Date.now();
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🐋 WhaleScope API Server                                ║
║                                                           ║
║   Status:  Running                                        ║
║   Port:    ${this.config.port.toString().padEnd(47)}║
║   CORS:    ${String(this.config.corsOrigin).padEnd(47)}║
║                                                           ║
║   Endpoints:                                              ║
║   • GET  /health           - Health check                 ║
║   • GET  /api/whales       - List whales                  ║
║   • GET  /api/whales/:addr - Whale details                ║
║   • GET  /api/tokens/:mint/whales - Token whales          ║
║   • GET  /api/movements    - Recent movements             ║
║   • GET  /api/movements/:tx - Movement details            ║
║   • GET  /api/signals      - Active signals               ║
║   • GET  /api/signals/:addr - Wallet signals              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
        resolve();
      });
    });
  }

  /**
   * Get the Express app instance (for testing)
   */
  getApp(): Express {
    return this.app;
  }
}

// ============================================
// Factory Function
// ============================================

/**
 * Create and optionally start the server
 */
export async function createServer(config?: Partial<ServerConfig>, autoStart = true): Promise<WhalescopeServer> {
  const server = new WhalescopeServer(config);
  if (autoStart) {
    await server.start();
  }
  return server;
}

export default WhalescopeServer;
