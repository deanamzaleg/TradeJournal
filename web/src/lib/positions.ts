import type { Transaction } from '../types';

export interface Position {
  symbol: string;
  shares: number;
  avgCost: number;
  realizedPnl: number;
  totalCost: number;
}

export interface ClosedTrade {
  symbol: string;
  sellId: string;
  sellDateTime: string;
  sharesSold: number;
  sellPrice: number;
  avgCost: number;
  realizedPnl: number;
  fee: number;
  strategy: string;
}

export function buildPositions(transactions: Transaction[]): {
  positions: Map<string, Position>;
  closedTrades: ClosedTrade[];
} {
  const positions = new Map<string, Position>();
  const closedTrades: ClosedTrade[] = [];

  const sorted = [...transactions].sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  for (const t of sorted) {
    const shares = t.quantityMode === 'dollars' ? t.quantity / t.price : t.quantity;
    const pos = positions.get(t.symbol) ?? { symbol: t.symbol, shares: 0, avgCost: 0, realizedPnl: 0, totalCost: 0 };

    if (t.side === 'BUY') {
      const newTotalCost = pos.totalCost + shares * t.price;
      const newShares = pos.shares + shares;
      pos.avgCost = newShares > 0 ? newTotalCost / newShares : 0;
      pos.shares = newShares;
      pos.totalCost = newTotalCost;
    } else {
      // SELL — close against avg cost. No shorting: ignore sells with no holdings.
      const soldShares = Math.min(shares, pos.shares);
      if (soldShares > 1e-9) {
        const avgCostAtSell = pos.avgCost;
        const realized = (t.price - avgCostAtSell) * soldShares - t.fee;
        pos.realizedPnl += realized;
        pos.shares -= soldShares;
        pos.totalCost = pos.shares * pos.avgCost;

        closedTrades.push({
          symbol: t.symbol,
          sellId: t.id,
          sellDateTime: t.dateTime,
          sharesSold: soldShares,
          sellPrice: t.price,
          avgCost: avgCostAtSell,
          realizedPnl: realized,
          fee: t.fee,
          strategy: t.strategy,
        });

        // Treat sub-5-cent residue as fully closed (dollar-mode rounding artifact)
        if (pos.shares * pos.avgCost < 0.05) {
          pos.shares = 0;
          pos.avgCost = 0;
          pos.totalCost = 0;
        }
      }
    }

    positions.set(t.symbol, pos);
  }

  return { positions, closedTrades };
}

export function openPositions(positions: Map<string, Position>): Position[] {
  return [...positions.values()].filter(p => p.shares * p.avgCost >= 0.05);
}
