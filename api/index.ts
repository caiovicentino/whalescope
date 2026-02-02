import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock whale data
const mockWhales = [
  {
    address: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
    label: "Institution Alpha",
    totalValueUsd: 250000000,
    tier: "mega",
    tags: ["institution", "long-term"],
    topHoldings: [{ symbol: "SOL", valueUsd: 225000000 }]
  },
  {
    address: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    label: "Raydium Authority",
    totalValueUsd: 125000000,
    tier: "mega",
    tags: ["dex", "raydium"],
    topHoldings: [{ symbol: "SOL", valueUsd: 75000000 }, { symbol: "USDC", valueUsd: 25000000 }]
  }
];

const mockMovements = [
  {
    txHash: "5UfDuX7hXvhbwQuQhKsYs1xKJ8VqM1R4uKiVXhWnfLVo",
    wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    type: "buy",
    tokenSymbol: "SOL",
    valueUsd: 7500000,
    protocol: "Jupiter"
  }
];

const mockSignals = [
  {
    id: "sig_001",
    type: "accumulation",
    tokenSymbol: "SOL",
    strength: 92,
    confidence: 87,
    description: "Large whale accumulating SOL aggressively"
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req;
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Routes
  if (url === '/' || url === '/api') {
    return res.json({
      name: "WhaleScope API",
      version: "1.0.0",
      description: "🐋 Solana Whale Intelligence Agent",
      endpoints: {
        whales: "/api/whales",
        movements: "/api/movements",
        signals: "/api/signals",
        health: "/api/health"
      },
      hackathon: "Colosseum Agent Hackathon 2026",
      agent: "Major (ID: 29)"
    });
  }

  if (url === '/api/health' || url === '/health') {
    return res.json({
      status: "healthy",
      timestamp: Date.now(),
      version: "1.0.0"
    });
  }

  if (url === '/api/whales') {
    return res.json({ whales: mockWhales, total: mockWhales.length });
  }

  if (url === '/api/movements') {
    return res.json({ movements: mockMovements, total: mockMovements.length });
  }

  if (url === '/api/signals') {
    return res.json({ signals: mockSignals, total: mockSignals.length });
  }

  return res.status(404).json({ error: "Not found" });
}
