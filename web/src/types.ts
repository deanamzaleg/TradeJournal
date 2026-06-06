export type AssetClass = 'Stocks' | 'Crypto' | 'Options' | 'Futures';
export type Side = 'BUY' | 'SELL';
export type QuantityMode = 'shares' | 'dollars';
export type StopType = 'none' | 'fixed' | 'trailing';

export interface Transaction {
  id: string;
  portfolioId: string;
  dateTime: string;
  symbol: string;
  assetClass: AssetClass;
  side: Side;
  price: number;
  quantity: number;
  quantityMode: QuantityMode;
  fee: number;
  stop: { type: StopType; price?: number; trailingPercent?: number };
  strategy: string;
  tags: string[];
  notes: string;
}

export type FxDirection = 'buy_usd' | 'sell_usd';

export interface CashDeposit {
  id: string;
  portfolioId: string;
  dateTime: string;
  direction?: FxDirection;   // 'buy_usd' (NIS→USD, default) | 'sell_usd' (USD→NIS)
  nisAmount: number;
  rate: number;
  usdReceived: number;
  usdAmount?: number;        // for sell_usd: USD withdrawn
}

export interface TaxEntry {
  id: string;
  portfolioId: string;
  dateTime: string;
  usdAmount: number;
  note?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  baseCurrency: 'USD';
  color?: string;          // hex accent for the topbar pill
}
