# 🐋 WhaleScope

Real-time Solana whale tracking and movement analysis for the Colosseum Agent Hackathon.

## Overview

WhaleScope monitors large Solana wallets ("whales") and provides real-time alerts and analytics on their movements. Track what the smart money is doing.

## Features

- 🔍 **Whale Discovery** - Identify and track high-value Solana wallets
- 📊 **Movement Analysis** - Real-time tracking of swaps, transfers, and DeFi activities
- 🚨 **Smart Alerts** - Get notified when whales make significant moves
- 📈 **Portfolio Insights** - See whale holdings and positions

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Blockchain:** Solana via @solana/web3.js
- **Data Provider:** Helius API

## Quick Start

```bash
# Install dependencies
npm install

# Copy env example and add your Helius API key
cp .env.example .env

# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HELIUS_API_KEY` | Your Helius API key | Yes |
| `PORT` | Server port (default: 3000) | No |
| `SOLANA_RPC_URL` | Custom RPC endpoint | No |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | API info |
| `GET /health` | Health check |
| `GET /api/whales` | List tracked whales (coming soon) |
| `GET /api/movements` | Recent whale movements (coming soon) |
| `GET /api/alerts` | Movement alerts (coming soon) |

## Project Structure

```
whalescope/
├── src/
│   ├── index.ts        # Entry point & Express server
│   ├── config.ts       # Environment configuration
│   └── types/
│       └── index.ts    # TypeScript interfaces
├── package.json
├── tsconfig.json
└── .env.example
```

## License

MIT

---

Built for the Colosseum Agent Hackathon 🏛️
