import { useMemo, useState } from 'react';
import type { Transaction } from '../../types';
import { buildPositions } from '../../lib/positions';
import { fmtUsd, fmtPct } from '../../lib/format';

interface Props { transactions: Transaction[] }

export function TopTrades({ transactions }: Props) {
  const [mode, setMode] = useState<'$' | '%'>('$');

  const { best, worst } = useMemo(() => {
    const { closedTrades } = buildPositions(transactions);
    if (closedTrades.length === 0) return { best: null, worst: null };

    const withPct = closedTrades.map(t => ({
      ...t,
      pct: t.avgCost > 0 ? ((t.sellPrice - t.avgCost) / t.avgCost) * 100 : 0,
    }));

    const sorted = mode === '$'
      ? [...withPct].sort((a, b) => b.realizedPnl - a.realizedPnl)
      : [...withPct].sort((a, b) => b.pct - a.pct);

    return { best: sorted[0] ?? null, worst: sorted[sorted.length - 1] ?? null };
  }, [transactions, mode]);

  const header = (
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-muted uppercase tracking-wide font-medium">Top Trades (Realized)</span>
      <div className="flex gap-0.5 bg-panel-2 rounded-md overflow-hidden border border-border">
        {(['$', '%'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-2.5 py-1 text-[11px] cursor-pointer transition-colors ${mode === m ? 'bg-accent text-bg font-bold' : 'text-muted hover:text-text'}`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );

  if (!best) {
    return (
      <div className="tj-card p-4">
        {header}
        <div className="text-muted text-xs text-center py-3">No closed trades yet</div>
      </div>
    );
  }

  function TradeRow({ ct, label, color }: { ct: typeof best; label: string; color: string }) {
    if (!ct) return null;
    const val = mode === '$' ? fmtUsd(ct.realizedPnl) : fmtPct(ct.pct, 1);
    return (
      <div className="flex items-center justify-between py-2 border-t border-border">
        <div>
          <div className="text-[11px] text-muted mb-0.5">{label}</div>
          <div className="font-bold text-text text-sm">{ct.symbol}</div>
          <div className="text-[11px] text-muted">{ct.sellDateTime.slice(0, 10)}</div>
        </div>
        <div className="text-[15px] font-bold tabular-nums" style={{ color }}>{val}</div>
      </div>
    );
  }

  return (
    <div className="tj-card p-4">
      {header}
      <TradeRow ct={best} label="Top Win" color="#2edc85" />
      {worst && worst !== best && <TradeRow ct={worst} label="Top Loss" color="#f0566e" />}
    </div>
  );
}
