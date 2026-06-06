import type { Transaction, CashDeposit, TaxEntry } from '../types';
import { buildPositions, openPositions } from './positions';
import type { ClosedTrade, Position } from './positions';

export interface RealizedKpis {
  netRealizedPnl: number;
  winRate: number;
  totalClosedTrades: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  bestTrade: ClosedTrade | null;
  worstTrade: ClosedTrade | null;
  expectancy: number;
  currentWinStreak: number;
  currentLossStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
}

export interface UnrealizedKpis {
  unrealizedPnl: number;
  openPositionCount: number;
  marketValue: number;
  hasPrices: boolean;
}

export interface CashKpis {
  freeCash: number;
  avgFxRate: number;
  totalDeposited: number;
  totalWithdrawn: number;
  monthlyFees: number;
}

export function calcRealizedKpis(
  transactions: Transaction[],
  periodFilter?: (iso: string) => boolean,
): RealizedKpis {
  // Build from ALL transactions so avgCost is always correct,
  // then filter closed trades by SELL date for the chosen period.
  const { closedTrades: allClosed } = buildPositions(transactions);
  const closedTrades = periodFilter
    ? allClosed.filter(ct => periodFilter(ct.sellDateTime))
    : allClosed;

  const wins = closedTrades.filter(t => t.realizedPnl > 0);
  const losses = closedTrades.filter(t => t.realizedPnl < 0);
  const nonBreakeven = closedTrades.filter(t => t.realizedPnl !== 0);

  const netRealizedPnl = closedTrades.reduce((s, t) => s + t.realizedPnl, 0);
  const winRate = nonBreakeven.length > 0 ? wins.length / nonBreakeven.length : 0;
  const totalWins = wins.reduce((s, t) => s + t.realizedPnl, 0);
  const totalLosses = Math.abs(losses.reduce((s, t) => s + t.realizedPnl, 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : wins.length > 0 ? Infinity : 0;
  const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;

  // Max drawdown (running peak → trough on cumulative P/L)
  let peak = 0, cumPnl = 0, maxDrawdown = 0;
  for (const t of closedTrades) {
    cumPnl += t.realizedPnl;
    if (cumPnl > peak) peak = cumPnl;
    const dd = peak - cumPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const sorted = [...closedTrades].sort((a, b) => b.realizedPnl - a.realizedPnl);
  const bestTrade = sorted[0] ?? null;
  const worstTrade = sorted[sorted.length - 1] ?? null;

  const expectancy = nonBreakeven.length > 0
    ? winRate * avgWin - (1 - winRate) * avgLoss
    : 0;

  // Streaks (chronological order — closedTrades already sorted by dateTime)
  let curWin = 0, curLoss = 0, longestWin = 0, longestLoss = 0;
  for (const t of nonBreakeven) {
    if (t.realizedPnl > 0) {
      curWin++; curLoss = 0;
      if (curWin > longestWin) longestWin = curWin;
    } else {
      curLoss++; curWin = 0;
      if (curLoss > longestLoss) longestLoss = curLoss;
    }
  }

  return {
    netRealizedPnl,
    winRate,
    totalClosedTrades: closedTrades.length,
    profitFactor,
    avgWin,
    avgLoss,
    maxDrawdown,
    bestTrade,
    worstTrade,
    expectancy,
    currentWinStreak: curWin,
    currentLossStreak: curLoss,
    longestWinStreak: longestWin,
    longestLossStreak: longestLoss,
  };
}

export function calcUnrealizedKpis(
  transactions: Transaction[],
  quotes: Map<string, number>,
): UnrealizedKpis {
  const { positions } = buildPositions(transactions);
  const open = openPositions(positions);

  let unrealizedPnl = 0;
  let marketValue = 0;
  let hasPrices = false;

  for (const pos of open) {
    const price = quotes.get(pos.symbol);
    if (price != null) {
      hasPrices = true;
      const mv = pos.shares * price;
      marketValue += mv;
      unrealizedPnl += (price - pos.avgCost) * pos.shares;
    } else {
      marketValue += pos.shares * pos.avgCost;
    }
  }

  return {
    unrealizedPnl,
    openPositionCount: open.length,
    marketValue,
    hasPrices,
  };
}

export function calcCashKpis(
  transactions: Transaction[],
  deposits: CashDeposit[],
  taxEntries: TaxEntry[],
): CashKpis {
  // Separate buy-USD (NIS→USD) deposits from sell-USD (USD→NIS) withdrawals
  const buyDeps = deposits.filter(d => !d.direction || d.direction === 'buy_usd');
  const sellDeps = deposits.filter(d => d.direction === 'sell_usd');

  const totalDeposited = buyDeps.reduce((s, d) => s + (d.usdReceived || 0), 0);
  const totalWithdrawn = sellDeps.reduce((s, d) => s + (d.usdAmount || 0), 0);

  // Weighted average NIS→USD rate (deposits only)
  const totalNis = buyDeps.reduce((s, d) => s + (d.nisAmount || 0), 0);
  const avgFxRate = totalDeposited > 0 ? totalNis / totalDeposited : 0;

  // Free cash = deposits - withdrawals - buys + sells - fees - tax
  let freeCash = totalDeposited - totalWithdrawn;
  for (const t of transactions) {
    const shares = t.quantityMode === 'dollars' ? t.quantity / t.price : t.quantity;
    const value = shares * t.price;
    if (t.side === 'BUY') freeCash -= value + t.fee;
    else freeCash += value - t.fee;
  }
  for (const tax of taxEntries) freeCash -= tax.usdAmount;

  // Monthly fees (current calendar month)
  const now = new Date();
  const monthFees = transactions
    .filter(t => {
      const d = new Date(t.dateTime);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((s, t) => s + t.fee, 0);

  return { freeCash, avgFxRate, totalDeposited, totalWithdrawn, monthlyFees: monthFees };
}

export function cumulativePnlSeries(transactions: Transaction[]): { date: string; pnl: number }[] {
  const { closedTrades } = buildPositions(transactions);
  let cumPnl = 0;
  return closedTrades.map(t => {
    cumPnl += t.realizedPnl;
    return { date: t.sellDateTime.slice(0, 10), pnl: cumPnl };
  });
}

export function pnlByStrategy(transactions: Transaction[]): { strategy: string; pnl: number; trades: number }[] {
  const { closedTrades } = buildPositions(transactions);
  const map = new Map<string, { pnl: number; trades: number }>();
  for (const t of closedTrades) {
    const key = t.strategy || 'Untagged';
    const cur = map.get(key) ?? { pnl: 0, trades: 0 };
    map.set(key, { pnl: cur.pnl + t.realizedPnl, trades: cur.trades + 1 });
  }
  return [...map.entries()].map(([strategy, v]) => ({ strategy, ...v }));
}

export function pnlByDayOfWeek(transactions: Transaction[]): { day: string; pnl: number }[] {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const { closedTrades } = buildPositions(transactions);
  const totals = new Array(7).fill(0) as number[];
  for (const t of closedTrades) {
    const dow = new Date(t.sellDateTime).getDay();
    totals[dow] += t.realizedPnl;
  }
  return DAYS.map((day, i) => ({ day, pnl: totals[i] }));
}

export interface PortfolioDayPoint {
  date: string;
  label: string;       // DD/MM
  value: number;       // open cost basis + cumulative realized P/L
  openCost: number;
  realizedPnl: number;
}

// Total portfolio value (open cost basis + cumulative realized) per active day.
export function portfolioValueByDay(transactions: Transaction[]): PortfolioDayPoint[] {
  const sorted = [...transactions].sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  const allDates = [...new Set(sorted.map(t => t.dateTime.slice(0, 10)))].sort();
  const result: PortfolioDayPoint[] = [];
  for (const date of allDates) {
    const upTo = sorted.filter(t => t.dateTime.slice(0, 10) <= date);
    const { positions, closedTrades } = buildPositions(upTo);
    let openCost = 0;
    for (const [, pos] of positions) {
      if (pos.shares > 1e-9) openCost += pos.shares * pos.avgCost;
    }
    const realizedPnl = closedTrades.reduce((s, t) => s + t.realizedPnl, 0);
    const [y, m, d] = date.split('-');
    void y;
    result.push({
      date,
      label: `${d}/${m}`,
      value: +(openCost + realizedPnl).toFixed(2),
      openCost: +openCost.toFixed(2),
      realizedPnl: +realizedPnl.toFixed(2),
    });
  }
  return result;
}

export interface MonthPnlPoint { key: string; label: string; year: string; pnl: number; }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Realized P/L grouped by calendar month (sell date), chronological.
export function pnlByMonth(transactions: Transaction[]): MonthPnlPoint[] {
  const { closedTrades } = buildPositions(transactions);
  const map = new Map<string, number>();
  for (const ct of closedTrades) {
    const key = ct.sellDateTime.slice(0, 7); // YYYY-MM
    map.set(key, (map.get(key) ?? 0) + ct.realizedPnl);
  }
  return [...map.keys()].sort().map(key => {
    const [y, m] = key.split('-');
    return { key, label: MONTHS[parseInt(m, 10) - 1], year: y, pnl: +(map.get(key) ?? 0).toFixed(2) };
  });
}

export { openPositions, buildPositions };
export type { Position, ClosedTrade };
