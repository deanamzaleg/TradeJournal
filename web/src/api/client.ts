import type { Transaction, CashDeposit, TaxEntry, Portfolio, FxDirection } from '../types';

export interface CashDepositInput {
  portfolioId: string;
  dateTime?: string;
  direction: FxDirection;
  rate: number;
  nisAmount?: number;   // buy_usd
  usdAmount?: number;   // sell_usd
}

// Derive backend host from the page URL so LAN clients hit the host machine,
// not their own localhost. On the host, hostname === 'localhost'.
const BASE = `http://${window.location.hostname}:5174/api`;

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
    throw new Error(err.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Portfolios
export const api = {
  portfolios: {
    list: () => req<Portfolio[]>('GET', '/portfolios'),
    create: (name: string, color?: string) => req<Portfolio>('POST', '/portfolios', { name, color }),
    update: (id: string, patch: { name?: string; color?: string }) => req<Portfolio>('PUT', `/portfolios/${id}`, patch),
    delete: (id: string) => req<void>('DELETE', `/portfolios/${id}`),
  },
  transactions: {
    list: (portfolioId: string) => req<Transaction[]>('GET', `/transactions?portfolioId=${portfolioId}`),
    create: (t: Omit<Transaction, 'id'>) => req<Transaction>('POST', '/transactions', t),
    update: (id: string, t: Partial<Transaction>) => req<Transaction>('PUT', `/transactions/${id}`, t),
    delete: (id: string) => req<void>('DELETE', `/transactions/${id}`),
  },
  cash: {
    listDeposits: (portfolioId: string) => req<CashDeposit[]>('GET', `/cash/deposits?portfolioId=${portfolioId}`),
    createDeposit: (d: CashDepositInput) => req<CashDeposit>('POST', '/cash/deposits', d),
    deleteDeposit: (id: string) => req<void>('DELETE', `/cash/deposits/${id}`),
    listTax: (portfolioId: string) => req<TaxEntry[]>('GET', `/cash/tax?portfolioId=${portfolioId}`),
    createTax: (t: Omit<TaxEntry, 'id'>) => req<TaxEntry>('POST', '/cash/tax', t),
    deleteTax: (id: string) => req<void>('DELETE', `/cash/tax/${id}`),
  },
  quote: {
    get: (symbol: string) => req<{ symbol: string; price: number }>('GET', `/quote?symbol=${symbol}`),
    refresh: () => req<{ ok: boolean }>('POST', '/quote/refresh'),
  },
  settings: {
    get: () => req<{ hasApiKey: boolean }>('GET', '/settings'),
    setApiKey: (key: string) => req<{ ok: boolean }>('POST', '/settings', { finnhubApiKey: key }),
  },
};
