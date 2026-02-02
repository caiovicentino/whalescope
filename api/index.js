export default function handler(req, res) {
  const url = req.url || '/';
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mockWhales = [
    { address: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH", label: "Institution Alpha", totalValueUsd: 250000000, tier: "mega" },
    { address: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1", label: "Raydium Authority", totalValueUsd: 125000000, tier: "mega" }
  ];

  const mockMovements = [
    { txHash: "5UfDuX7...", wallet: "9WzDXw...", type: "buy", tokenSymbol: "SOL", valueUsd: 7500000, protocol: "Jupiter" }
  ];

  const mockSignals = [
    { id: "sig_001", type: "accumulation", tokenSymbol: "SOL", strength: 92, confidence: 87, description: "Large whale accumulating SOL" }
  ];

  if (url === '/' || url === '/api' || url === '/api/') {
    return res.json({
      name: "🐋 WhaleScope API",
      version: "1.0.0",
      description: "Solana Whale Intelligence Agent",
      endpoints: { whales: "/api/whales", movements: "/api/movements", signals: "/api/signals" },
      hackathon: "Colosseum Agent Hackathon 2026",
      agent: "Major (ID: 29)"
    });
  }

  if (url.includes('/health')) {
    return res.json({ status: "healthy", timestamp: Date.now() });
  }

  if (url.includes('/whales')) {
    return res.json({ whales: mockWhales, total: 2 });
  }

  if (url.includes('/movements')) {
    return res.json({ movements: mockMovements, total: 1 });
  }

  if (url.includes('/signals')) {
    return res.json({ signals: mockSignals, total: 1 });
  }

  return res.status(404).json({ error: "Not found" });
}
