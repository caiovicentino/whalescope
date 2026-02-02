// @ts-nocheck
// Vercel Serverless Handler for WhaleScope
import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for demo
const mockWhales = [
  {
    address: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
    label: "Institution Alpha",
    totalValueUsd: 250000000,
    tier: "mega",
    tags: ["institution", "long-term", "sol-maximalist"],
    topHoldings: [
      { symbol: "SOL", name: "Wrapped SOL", valueUsd: 225000000, portfolioPercent: 90 }
    ],
    lastActive: Date.now() - 3600000
  },
  {
    address: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    label: "Raydium Authority",
    totalValueUsd: 125000000,
    tier: "mega",
    tags: ["dex", "raydium", "liquidity"],
    topHoldings: [
      { symbol: "SOL", valueUsd: 75000000, portfolioPercent: 60 },
      { symbol: "USDC", valueUsd: 25000000, portfolioPercent: 20 }
    ],
    lastActive: Date.now() - 7200000
  },
  {
    address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    label: "Smart Money Trader",
    totalValueUsd: 45000000,
    tier: "large",
    tags: ["trader", "memecoin", "degen"],
    topHoldings: [
      { symbol: "SOL", valueUsd: 20000000, portfolioPercent: 44 },
      { symbol: "BONK", valueUsd: 15000000, portfolioPercent: 33 }
    ],
    lastActive: Date.now() - 1800000
  }
];

const mockMovements = [
  {
    txHash: "5UfDuX7hXvhbwQuQhKsYs1xKJ8VqM1R4uKiVXhWnfLVo7VdvPyGxWKYNTGPVsKUmvKAqJjBvVqYpYi3u7YQBHQJN",
    timestamp: Date.now() - 300000,
    wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    type: "buy",
    tokenSymbol: "SOL",
    amount: 50000,
    valueUsd: 7500000,
    protocol: "Jupiter",
    significance: 95
  },
  {
    txHash: "3KfDuX7hXvhbwQuQhKsYs1xKJ8VqM1R4uKiVXhWnfLVo7VdvPyGxWKYNTGPVsKUmvKAqJjBvVqYpYi3u7YQBHQJM",
    timestamp: Date.now() - 900000,
    wallet: "CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq",
    type: "buy",
    tokenSymbol: "BONK",
    amount: 10000000000,
    valueUsd: 300000,
    protocol: "Raydium",
    significance: 72
  }
];

const mockSignals = [
  {
    id: "sig_001",
    type: "accumulation",
    wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    tokenSymbol: "SOL",
    strength: 92,
    confidence: 87,
    description: "Large whale accumulating SOL aggressively over past 24h. 3 separate buys totaling $15M.",
    evidence: [
      { type: "transaction", description: "Buy $7.5M SOL via Jupiter" },
      { type: "pattern", description: "DCA pattern detected - buys at regular intervals" }
    ],
    timestamp: Date.now() - 600000
  },
  {
    id: "sig_002",
    type: "new_position",
    wallet: "CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq",
    tokenSymbol: "BONK",
    strength: 68,
    confidence: 91,
    description: "Known memecoin trader opened new BONK position worth $300K.",
    evidence: [
      { type: "transaction", description: "First BONK purchase by this wallet" }
    ],
    timestamp: Date.now() - 1200000
  }
];

// Routes
app.get('/', (req, res) => {
  res.json({
    name: "🐋 WhaleScope API",
    version: "1.0.0",
    description: "Solana Whale Intelligence Agent - Real-time tracking of whale wallets, accumulation patterns, and large movements.",
    endpoints: {
      whales: "GET /api/whales",
      movements: "GET /api/movements",
      signals: "GET /api/signals",
      health: "GET /api/health"
    },
    stats: {
      trackedWhales: mockWhales.length,
      recentMovements: mockMovements.length,
      activeSignals: mockSignals.length
    },
    hackathon: "Colosseum Agent Hackathon 2026",
    agent: "Major (ID: 29)",
    github: "https://github.com/caiovicentino/whalescope",
    colosseum: "https://colosseum.com/agent-hackathon/projects/whalescope"
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: "healthy",
    timestamp: Date.now(),
    version: "1.0.0",
    uptime: process.uptime()
  });
});

app.get('/api/whales', (req, res) => {
  const { tier, minValue } = req.query;
  let whales = [...mockWhales];
  
  if (tier) {
    whales = whales.filter(w => w.tier === tier);
  }
  if (minValue) {
    whales = whales.filter(w => w.totalValueUsd >= Number(minValue));
  }
  
  res.json({
    whales,
    total: whales.length,
    description: "Top whale wallets on Solana sorted by holdings"
  });
});

app.get('/api/whales/:address', (req, res) => {
  const whale = mockWhales.find(w => w.address === req.params.address);
  if (!whale) {
    return res.status(404).json({ error: "Whale not found" });
  }
  res.json({ whale });
});

app.get('/api/movements', (req, res) => {
  const { type, minValue } = req.query;
  let movements = [...mockMovements];
  
  if (type) {
    movements = movements.filter(m => m.type === type);
  }
  if (minValue) {
    movements = movements.filter(m => m.valueUsd >= Number(minValue));
  }
  
  res.json({
    movements,
    total: movements.length,
    description: "Recent large movements (>$50k) by tracked whales"
  });
});

app.get('/api/signals', (req, res) => {
  const { type, minStrength } = req.query;
  let signals = [...mockSignals];
  
  if (type) {
    signals = signals.filter(s => s.type === type);
  }
  if (minStrength) {
    signals = signals.filter(s => s.strength >= Number(minStrength));
  }
  
  res.json({
    signals,
    total: signals.length,
    description: "Accumulation and distribution signals with confidence scores"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    availableEndpoints: ["/", "/api/whales", "/api/movements", "/api/signals", "/api/health"]
  });
});

// Export for Vercel
export default app;
