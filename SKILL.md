---
name: whalescope
description: Real-time Solana whale tracking and movement analysis. Monitor what smart money is doing - swaps, transfers, DeFi activities. Get alerts on significant moves.
metadata:
  openclaw:
    emoji: "🐋"
    requires:
      bins: ["curl"]
---

# WhaleScope 🐋

**Solana Whale Intelligence**

*Track what the smart money is doing.*

## What is WhaleScope?

Real-time monitoring of large Solana wallets ("whales"):
- **Whale Discovery** — Identify high-value wallets
- **Movement Analysis** — Track swaps, transfers, DeFi activities
- **Smart Alerts** — Notifications on significant moves
- **Portfolio Insights** — See whale holdings and positions

## API Endpoints

Base URL: Check deployment URL in repo

### Health Check
```bash
curl https://whalescope-api.example.com/health
```

### API Info
```bash
curl https://whalescope-api.example.com/
```

### List Tracked Whales
```bash
curl https://whalescope-api.example.com/api/whales
```

Returns list of monitored whale wallets with:
- Wallet address
- Portfolio value
- Last activity timestamp

### Recent Movements
```bash
curl https://whalescope-api.example.com/api/movements
```

Returns recent whale activities:
- Swaps (token, amount, DEX)
- Transfers (to/from, amount)
- DeFi interactions (protocol, action)

### Movement Alerts
```bash
curl https://whalescope-api.example.com/api/alerts
```

Returns significant whale movements that crossed alert thresholds.

## Use Cases for Agents

- **Trading agent** — Follow whale trades as signals
- **Risk agent** — Detect whale dumps before they crash prices
- **Research agent** — Analyze whale strategies and portfolios
- **Alert agent** — Notify users of whale activity in their tokens

## Data Source

Powered by Helius API for real-time Solana transaction monitoring.

## Example Integration

```typescript
// Check if whales are accumulating a token
const movements = await fetch('https://whalescope-api/api/movements?token=BONK');
const buyVolume = movements.filter(m => m.type === 'buy').reduce((sum, m) => sum + m.amount, 0);
const sellVolume = movements.filter(m => m.type === 'sell').reduce((sum, m) => sum + m.amount, 0);

if (buyVolume > sellVolume * 2) {
  console.log('Whales accumulating!');
}
```

## Links

- **GitHub:** https://github.com/caiovicentino/whalescope
- **Built by:** Caio for Colosseum Agent Hackathon 2026

---

*"When whales move, pay attention."* 🐋
