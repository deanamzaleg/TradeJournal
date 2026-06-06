import { useMemo } from 'react';
import type { Transaction } from '../../types';
import { fmtUsd, fmtShares, fmtDateTime, fmtPct } from '../../lib/format';
import { Trash2, Pencil, TrendingDown } from 'lucide-react';
import { useSort, SortTh } from './useSort';

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onSell: (symbol: string) => void;
  quotes: Map<string, number>;
}

export function BuysTable({ transactions, onEdit, onDelete, onSell, quotes }: Props) {
  const { sortCol, sortDir, onSort, sortRows } = useSort('date', 'desc');

  const buysRaw = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => a.dateTime.localeCompare(b.dateTime));
    const rows: Array<Transaction & { avgCostAtBuy: number; shares: number }> = [];
    const running = new Map<string, { shares: number; avgCost: number }>();

    for (const t of sorted) {
      const sh = t.quantityMode === 'dollars' ? t.quantity / t.price : t.quantity;
      const cur = running.get(t.symbol) ?? { shares: 0, avgCost: 0 };
      if (t.side === 'BUY') {
        const totalCost = cur.shares * cur.avgCost + sh * t.price;
        const newShares = cur.shares + sh;
        const newAvg = newShares > 0 ? totalCost / newShares : 0;
        running.set(t.symbol, { shares: newShares, avgCost: newAvg });
        rows.push({ ...t, avgCostAtBuy: newAvg, shares: sh });
      } else {
        const remaining = Math.max(0, cur.shares - sh);
        // Mirror positions.ts: sub-5-cent residue = fully closed (dollar-mode rounding)
        const remainingValue = remaining * cur.avgCost;
        running.set(t.symbol, { shares: remainingValue < 0.05 ? 0 : remaining, avgCost: cur.avgCost });
      }
    }
    return rows.filter(r => (running.get(r.symbol)?.shares ?? 0) > 1e-9);
  }, [transactions]);

  const rows = useMemo(() => {
    const withCalc = buysRaw.map(t => {
      const cp = quotes.get(t.symbol);
      return {
        ...t,
        currentPrice: cp ?? null,
        unrealPct: cp != null ? ((cp - t.price) / t.price) * 100 : null,
        unrealDollar: cp != null ? (cp - t.price) * t.shares : null,
        value: t.shares * t.price,
      };
    });
    return sortRows(withCalc, (r, col) => {
      switch (col) {
        case 'date': return r.dateTime;
        case 'symbol': return r.symbol;
        case 'buyPrice': return r.price;
        case 'shares': return r.shares;
        case 'value': return r.value;
        case 'avgCost': return r.avgCostAtBuy;
        case 'currentPrice': return r.currentPrice ?? -Infinity;
        case 'unrealPct': return r.unrealPct ?? -Infinity;
        case 'unrealDollar': return r.unrealDollar ?? -Infinity;
        case 'strategy': return r.strategy || '';
        default: return 0;
      }
    });
  }, [buysRaw, quotes, sortCol, sortDir]);

  if (rows.length === 0) {
    return <div className="text-center text-muted text-sm py-8">No open trades yet</div>;
  }

  const th = (col: string, label: string) => (
    <SortTh col={col} label={label} sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
  );
  const plClass = (v: number | null) => (v == null ? 'text-muted' : v >= 0 ? 'text-positive' : 'text-negative');

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {th('date', 'Date')}
            {th('symbol', 'Symbol')}
            {th('buyPrice', 'Buy Price')}
            {th('shares', 'Shares')}
            {th('value', 'Value')}
            {th('avgCost', 'Avg Cost')}
            {th('currentPrice', 'Current Price')}
            {th('unrealPct', 'Unreal. P/L %')}
            {th('unrealDollar', 'Unreal. P/L $')}
            {th('strategy', 'Strategy')}
            <th className="py-2 px-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map(t => (
            <tr key={t.id} className="border-b border-border/40 hover:bg-panel-2 transition-colors">
              <td className="py-2 px-3 text-muted tabular-nums text-xs">{fmtDateTime(t.dateTime)}</td>
              <td className="py-2 px-3 text-text font-medium">{t.symbol}</td>
              <td className="py-2 px-3 tabular-nums text-buy font-semibold">{fmtUsd(t.price)}</td>
              <td className="py-2 px-3 tabular-nums text-muted">{fmtShares(t.shares)}</td>
              <td className="py-2 px-3 tabular-nums text-text">{fmtUsd(t.value)}</td>
              <td className="py-2 px-3 tabular-nums text-muted">{fmtUsd(t.avgCostAtBuy)}</td>
              <td className="py-2 px-3 tabular-nums text-text">
                {t.currentPrice != null ? fmtUsd(t.currentPrice) : <span className="text-muted">—</span>}
              </td>
              <td className={`py-2 px-3 tabular-nums text-xs font-semibold ${plClass(t.unrealPct)}`}>
                {t.unrealPct != null ? fmtPct(t.unrealPct, 1) : '—'}
              </td>
              <td className={`py-2 px-3 tabular-nums font-semibold ${plClass(t.unrealDollar)}`}>
                {t.unrealDollar != null ? fmtUsd(t.unrealDollar) : '—'}
              </td>
              <td className="py-2 px-3 text-muted text-xs">{t.strategy || '—'}</td>
              <td className="py-2 px-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => onSell(t.symbol)}
                    aria-label={`Sell ${t.symbol}`}
                    title={`Sell ${t.symbol}`}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-negative border border-negative/30 hover:bg-negative/10 hover:border-negative cursor-pointer transition-colors"
                  >
                    <TrendingDown size={12} /> SELL
                  </button>
                  <button onClick={() => onEdit(t)} aria-label={`Edit ${t.symbol} buy`} className="p-1.5 rounded-md text-muted hover:text-text hover:bg-panel-2"><Pencil size={14} /></button>
                  <button onClick={() => onDelete(t.id)} aria-label={`Delete ${t.symbol} buy`} className="p-1.5 rounded-md text-muted hover:text-negative hover:bg-negative/10"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
