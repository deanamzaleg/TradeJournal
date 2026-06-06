import { useMemo } from 'react';
import type { Transaction } from '../../types';
import { buildPositions } from '../../lib/positions';
import { fmtUsd, fmtShares, fmtDateTime, fmtPct } from '../../lib/format';
import { Trash2, Pencil } from 'lucide-react';
import { useSort, SortTh } from './useSort';

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export function SellsTable({ transactions, onEdit, onDelete }: Props) {
  const { sortCol, sortDir, onSort, sortRows } = useSort('date', 'desc');

  const rows = useMemo(() => {
    const { closedTrades } = buildPositions(transactions);
    const withPct = closedTrades.map(ct => ({
      ...ct,
      pct: ct.avgCost > 0 ? ((ct.sellPrice - ct.avgCost) / ct.avgCost) * 100 : 0,
    }));
    return sortRows(withPct, (r, col) => {
      switch (col) {
        case 'date': return r.sellDateTime;
        case 'symbol': return r.symbol;
        case 'sellPrice': return r.sellPrice;
        case 'avgCost': return r.avgCost;
        case 'shares': return r.sharesSold;
        case 'pnl': return r.realizedPnl;
        case 'pct': return r.pct;
        case 'fee': return r.fee;
        case 'strategy': return r.strategy || '';
        default: return 0;
      }
    });
  }, [transactions, sortCol, sortDir]);

  const txById = useMemo(() => new Map(transactions.map(t => [t.id, t])), [transactions]);

  if (rows.length === 0) {
    return <div className="text-center text-muted text-sm py-8">No closed trades yet</div>;
  }

  const th = (col: string, label: string) => (
    <SortTh col={col} label={label} sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {th('date', 'Date')}
            {th('symbol', 'Symbol')}
            {th('sellPrice', 'Sell Price')}
            {th('avgCost', 'Avg Cost')}
            {th('shares', 'Shares')}
            {th('pnl', 'Realized P/L')}
            {th('pct', '%')}
            {th('fee', 'Fee')}
            {th('strategy', 'Strategy')}
            <th className="py-2 px-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map(ct => {
            const tx = txById.get(ct.sellId);
            return (
              <tr key={ct.sellId} className="border-b border-border/40 hover:bg-panel-2 transition-colors">
                <td className="py-2 px-3 text-muted tabular-nums text-xs">{fmtDateTime(ct.sellDateTime)}</td>
                <td className="py-2 px-3 text-text font-medium">{ct.symbol}</td>
                <td className="py-2 px-3 tabular-nums text-text">{fmtUsd(ct.sellPrice)}</td>
                <td className="py-2 px-3 tabular-nums text-muted">{fmtUsd(ct.avgCost)}</td>
                <td className="py-2 px-3 tabular-nums text-muted">{fmtShares(ct.sharesSold)}</td>
                <td className={`py-2 px-3 tabular-nums font-semibold ${ct.realizedPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {fmtUsd(ct.realizedPnl)}
                </td>
                <td className={`py-2 px-3 tabular-nums text-xs ${ct.pct >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {fmtPct(ct.pct, 1)}
                </td>
                <td className="py-2 px-3 tabular-nums text-muted text-xs">{fmtUsd(ct.fee)}</td>
                <td className="py-2 px-3 text-muted text-xs">{ct.strategy || '—'}</td>
                <td className="py-2 px-3">
                  {tx && (
                    <div className="flex gap-1">
                      <button onClick={() => onEdit(tx)} aria-label={`Edit ${ct.symbol} trade`} className="p-1.5 rounded-md text-muted hover:text-text hover:bg-panel-2"><Pencil size={14} /></button>
                      <button onClick={() => onDelete(ct.sellId)} aria-label={`Delete ${ct.symbol} trade`} className="p-1.5 rounded-md text-muted hover:text-negative hover:bg-negative/10"><Trash2 size={14} /></button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
