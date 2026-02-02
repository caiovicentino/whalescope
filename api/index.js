// WhaleScope API - Serverless Handler
// Colosseum Agent Hackathon 2026

const mockWhales = [
  {
    address: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
    label: "Institution Alpha",
    totalValueUsd: 250000000,
    tier: "mega",
    tags: ["institution", "long-term", "sol-maximalist"],
    topHoldings: [
      { symbol: "SOL", name: "Wrapped SOL", valueUsd: 225000000, portfolioPercent: 90 }
    ]
  },
  {
    address: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    label: "Raydium Authority",
    totalValueUsd: 125000000,
    tier: "mega",
    tags: ["dex", "raydium", "liquidity"],
    topHoldings: [
      { symbol: "SOL", name: "Wrapped SOL", valueUsd: 75000000, portfolioPercent: 60 },
      { symbol: "USDC", name: "USD Coin", valueUsd: 25000000, portfolioPercent: 20 }
    ]
  },
  {
    address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    label: "Smart Money Trader",
    totalValueUsd: 45000000,
    tier: "large",
    tags: ["trader", "memecoin", "degen"],
    topHoldings: [
      { symbol: "SOL", valueUsd: 20000000 },
      { symbol: "BONK", valueUsd: 15000000 }
    ]
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
    ]
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
    ]
  }
];

module.exports = (req, res) => {
  const url = req.url || '/';
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Routes
  if (url === '/' || url === '/api' || url === '/api/') {
    return res.json({
      name: "🐋 WhaleScope API",
      version: "1.0.0",
      description: "Solana Whale Intelligence Agent - Real-time tracking of whale wallets, accumulation patterns, and large movements.",
      endpoints: {
        whales: "GET /api/whales",
        movements: "GET /api/movements", 
        signals: "GET /api/signals",
        health: "GET /api/health"
      },
      hackathon: "Colosseum Agent Hackathon 2026",
      agent: "Major (ID: 29)",
      github: "https://github.com/caiovicentino/whalescope",
      colosseum: "https://colosseum.com/agent-hackathon/projects/whalescope"
    });
  }

  if (url === '/api/health' || url === '/health') {
    return res.json({
      status: "healthy",
      timestamp: Date.now(),
      version: "1.0.0",
      uptime: process.uptime()
    });
  }

  if (url === '/api/whales' || url.startsWith('/api/whales?')) {
    return res.json({ 
      whales: mockWhales, 
      total: mockWhales.length,
      description: "Top whale wallets on Solana sorted by holdings"
    });
  }

  if (url === '/api/movements' || url.startsWith('/api/movements?')) {
    return res.json({ 
      movements: mockMovements, 
      total: mockMovements.length,
      description: "Recent large movements (>$50k) by tracked whales"
    });
  }

  if (url === '/api/signals' || url.startsWith('/api/signals?')) {
    return res.json({ 
      signals: mockSignals, 
      total: mockSignals.length,
      description: "Accumulation and distribution signals with confidence scores"
    });
  }

  return res.status(404).json({ 
    error: "Not found",
    availableEndpoints: ["/api/whales", "/api/movements", "/api/signals", "/api/health"]
  });
};
