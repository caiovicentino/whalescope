/**
 * WhaleScope - Main Entry Point
 * 
 * Real-time whale tracking and signal detection for Solana
 * Built for the Colosseum Agent Hackathon
 * 
 * @version 1.0.0
 */

import { createServer } from './api/server';

// Re-export API types
export type * from './types/api';

// Re-export server
export { createServer, WhalescopeServer } from './api/server';

// ============================================
// Configuration
// ============================================

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  enableLogging: process.env.NODE_ENV !== 'test'
};

// ============================================
// Main Entry
// ============================================

async function main(): Promise<void> {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🐋 W H A L E S C O P E                                  ║
║                                                           ║
║   Real-time whale tracking and signal detection           ║
║   for Solana                                              ║
║                                                           ║
║   Colosseum Agent Hackathon 2025                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  try {
    // Start the API server
    await createServer(config);
    
    console.log('[WhaleScope] All systems operational ✓');
    console.log('[WhaleScope] Listening for whale activity...');
    
  } catch (error) {
    console.error('[WhaleScope] Failed to start:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[WhaleScope] Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[WhaleScope] Received SIGTERM, shutting down...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[WhaleScope] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[WhaleScope] Unhandled rejection:', reason);
  process.exit(1);
});

// Run if this is the main module
const isMain = require.main === module || process.argv[1]?.includes('index');
if (isMain) {
  main();
}

// Export for testing
export { main };
