/**
 * Helius API Service
 * Interacts with Helius API for Solana blockchain data
 * @see https://docs.helius.dev/
 */

import type {
  TokenHolder,
  ParsedTransaction,
  TransactionType,
  HeliusEnhancedTransaction,
  HeliusTokenTransfer,
} from '../types';
import { toUiAmount, lamportsToSol } from '../utils/solana';

const HELIUS_BASE_URL = 'https://api.helius.xyz/v0';
const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com';

/**
 * Get API key from environment
 */
function getApiKey(): string {
  const key = process.env.HELIUS_API_KEY;
  if (!key) {
    throw new Error('HELIUS_API_KEY environment variable not set');
  }
  return key;
}

/**
 * Make a request to the Helius API
 */
async function heliusRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();
  const url = `${HELIUS_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api-key=${apiKey}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Helius API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Make a JSON-RPC request to Helius
 */
async function heliusRpc<T>(method: string, params: any[]): Promise<T> {
  const apiKey = getApiKey();
  const url = `${HELIUS_RPC_URL}/?api-key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Helius RPC error: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`);
  }

  return data.result;
}

/**
 * Get largest token holders for a specific mint
 * Uses DAS API to fetch token accounts sorted by balance
 * 
 * @param mint - Token mint address
 * @param limit - Max number of holders to return (default 20)
 * @returns Array of token holders sorted by holdings
 */
export async function getLargestTokenHolders(
  mint: string,
  limit: number = 20
): Promise<TokenHolder[]> {
  // Use getTokenLargestAccounts RPC method
  const result = await heliusRpc<{
    context: { slot: number };
    value: Array<{
      address: string;
      amount: string;
      decimals: number;
      uiAmount: number;
      uiAmountString: string;
    }>;
  }>('getTokenLargestAccounts', [mint]);

  return result.value.slice(0, limit).map((account) => ({
    address: account.address,
    amount: parseInt(account.amount, 10),
    decimals: account.decimals,
    uiAmount: account.uiAmount,
  }));
}

/**
 * Get token accounts owned by a specific wallet
 * 
 * @param owner - Wallet address
 * @param mint - Optional: filter by specific mint
 * @returns Array of token holdings
 */
export async function getTokenAccountsByOwner(
  owner: string,
  mint?: string
): Promise<TokenHolder[]> {
  const params: any[] = [
    owner,
    mint ? { mint } : { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    { encoding: 'jsonParsed' },
  ];

  const result = await heliusRpc<{
    context: { slot: number };
    value: Array<{
      account: {
        data: {
          parsed: {
            info: {
              mint: string;
              owner: string;
              tokenAmount: {
                amount: string;
                decimals: number;
                uiAmount: number;
              };
            };
          };
        };
      };
      pubkey: string;
    }>;
  }>('getTokenAccountsByOwner', params);

  return result.value.map((item) => {
    const info = item.account.data.parsed.info;
    return {
      address: item.pubkey,
      amount: parseInt(info.tokenAmount.amount, 10),
      decimals: info.tokenAmount.decimals,
      uiAmount: info.tokenAmount.uiAmount,
    };
  });
}

/**
 * Get recent transactions for a wallet address
 * Uses Helius Enhanced Transactions API for parsed data
 * 
 * @param address - Wallet address to query
 * @param limit - Max transactions to fetch (default 100)
 * @returns Array of enhanced transactions
 */
export async function getRecentTransactions(
  address: string,
  limit: number = 100
): Promise<HeliusEnhancedTransaction[]> {
  return heliusRequest<HeliusEnhancedTransaction[]>(
    `/addresses/${address}/transactions?limit=${limit}`
  );
}

/**
 * Get parsed transaction history for a wallet
 * Uses the parse-transactions endpoint for detailed parsing
 * 
 * @param signatures - Array of transaction signatures
 * @returns Array of enhanced transactions
 */
export async function parseTransactions(
  signatures: string[]
): Promise<HeliusEnhancedTransaction[]> {
  return heliusRequest<HeliusEnhancedTransaction[]>('/transactions', {
    method: 'POST',
    body: JSON.stringify({ transactions: signatures }),
  });
}

/**
 * Parse a Helius enhanced transaction into our internal format
 * Extracts key information for whale tracking
 * 
 * @param tx - Raw Helius enhanced transaction
 * @param trackedWallet - The wallet we're tracking (to determine direction)
 * @returns Parsed transaction with simplified structure
 */
export function parseTransactionData(
  tx: HeliusEnhancedTransaction,
  trackedWallet: string
): ParsedTransaction {
  const txType = classifyTransactionType(tx);
  
  const parsed: ParsedTransaction = {
    signature: tx.signature,
    timestamp: tx.timestamp,
    type: txType,
    source: tx.source || 'unknown',
    fee: lamportsToSol(tx.fee),
    success: true, // Enhanced API only returns successful txs
  };

  // Process token transfers
  if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
    const { incoming, outgoing } = categorizeTransfers(tx.tokenTransfers, trackedWallet);

    if (txType === 'swap' && incoming.length > 0 && outgoing.length > 0) {
      // For swaps, tokenIn is what we sent, tokenOut is what we received
      const tokenIn = outgoing[0];
      const tokenOut = incoming[0];

      parsed.tokenIn = {
        mint: tokenIn.mint,
        amount: tokenIn.tokenAmount,
        decimals: 0, // Helius doesn't include decimals in tokenTransfers
        uiAmount: tokenIn.tokenAmount,
      };

      parsed.tokenOut = {
        mint: tokenOut.mint,
        amount: tokenOut.tokenAmount,
        decimals: 0,
        uiAmount: tokenOut.tokenAmount,
      };
    } else if (txType === 'transfer') {
      // For simple transfers
      const transfer = incoming[0] || outgoing[0];
      if (transfer) {
        parsed.transfer = {
          mint: transfer.mint,
          amount: transfer.tokenAmount,
          decimals: 0,
          uiAmount: transfer.tokenAmount,
        };
      }
    }
  }

  return parsed;
}

/**
 * Classify transaction type based on Helius data
 */
function classifyTransactionType(tx: HeliusEnhancedTransaction): TransactionType {
  const typeStr = tx.type?.toUpperCase() || '';
  const source = tx.source?.toUpperCase() || '';

  // Swap detection
  if (
    typeStr.includes('SWAP') ||
    source.includes('JUPITER') ||
    source.includes('RAYDIUM') ||
    source.includes('ORCA')
  ) {
    return 'swap';
  }

  // Stake detection
  if (
    typeStr.includes('STAKE') ||
    source.includes('MARINADE') ||
    source.includes('JITO')
  ) {
    if (typeStr.includes('UNSTAKE') || typeStr.includes('WITHDRAW')) {
      return 'unstake';
    }
    return 'stake';
  }

  // Transfer detection
  if (
    typeStr.includes('TRANSFER') ||
    tx.tokenTransfers?.length === 1 ||
    tx.nativeTransfers?.length > 0
  ) {
    return 'transfer';
  }

  return 'unknown';
}

/**
 * Categorize token transfers as incoming or outgoing for a wallet
 */
function categorizeTransfers(
  transfers: HeliusTokenTransfer[],
  wallet: string
): { incoming: HeliusTokenTransfer[]; outgoing: HeliusTokenTransfer[] } {
  const incoming: HeliusTokenTransfer[] = [];
  const outgoing: HeliusTokenTransfer[] = [];

  for (const transfer of transfers) {
    if (transfer.toUserAccount === wallet) {
      incoming.push(transfer);
    } else if (transfer.fromUserAccount === wallet) {
      outgoing.push(transfer);
    }
  }

  return { incoming, outgoing };
}

/**
 * Get token metadata using DAS API
 * 
 * @param mint - Token mint address
 * @returns Token metadata including name, symbol, decimals
 */
export async function getTokenMetadata(mint: string): Promise<{
  name: string;
  symbol: string;
  decimals: number;
} | null> {
  try {
    const result = await heliusRpc<{
      decimals: number;
      supply: string;
    }>('getTokenSupply', [mint]);

    return {
      name: mint, // Helius doesn't return name in this endpoint
      symbol: mint.slice(0, 4),
      decimals: result.decimals,
    };
  } catch {
    return null;
  }
}

/**
 * Subscribe to address activity via webhooks (helper to construct webhook payload)
 * Note: Actual webhook registration requires Helius dashboard or API
 * 
 * @param addresses - Addresses to monitor
 * @param webhookUrl - URL to receive notifications
 * @returns Webhook configuration object
 */
export function createWebhookConfig(
  addresses: string[],
  webhookUrl: string
): object {
  return {
    webhookURL: webhookUrl,
    transactionTypes: ['Any'],
    accountAddresses: addresses,
    webhookType: 'enhanced',
  };
}
