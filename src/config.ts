import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Helius API
  heliusApiKey: process.env.HELIUS_API_KEY || '',
  heliusRpcUrl: process.env.HELIUS_API_KEY 
    ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    : 'https://api.mainnet-beta.solana.com',
  heliusApiUrl: 'https://api.helius.xyz/v0',

  // Solana
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',

  // Whale tracking thresholds
  whaleMinValueUsd: 100_000, // $100k minimum to be considered a whale
  alertThresholdUsd: 50_000, // Movements above this trigger alerts
} as const;

// Validate required config
export function validateConfig(): void {
  const missing: string[] = [];

  if (!config.heliusApiKey) {
    missing.push('HELIUS_API_KEY');
  }

  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('   Some features may not work. See .env.example for setup.');
  }
}

export default config;
