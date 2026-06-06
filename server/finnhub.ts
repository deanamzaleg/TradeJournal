import https from 'https';
import { getApiKey } from './settings';

const CACHE = new Map<string, { price: number; ts: number }>();
const CACHE_TTL_MS = 20_000;

export function clearCache(): void {
  CACHE.clear();
}

export function getQuote(symbol: string): Promise<number> {
  const cached = CACHE.get(symbol);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return Promise.resolve(cached.price);
  }

  const apiKey = getApiKey();
  if (!apiKey) return Promise.reject(new Error('FINNHUB_API_KEY not set'));

  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(raw) as { c?: number; pc?: number };
          // c = current price (0 when market closed), pc = previous close
          const price = (typeof data.c === 'number' && data.c > 0) ? data.c
                      : (typeof data.pc === 'number' && data.pc > 0) ? data.pc
                      : null;
          if (price === null) {
            reject(new Error(`No price for ${symbol}`));
            return;
          }
          CACHE.set(symbol, { price, ts: Date.now() });
          resolve(price);
        } catch {
          reject(new Error('Invalid Finnhub response'));
        }
      });
    }).on('error', reject);
  });
}
