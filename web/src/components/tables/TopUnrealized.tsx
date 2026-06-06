import { useMemo, useState } from 'react';
import type { Transaction } from '../../types';
import { buildPositions, openPositions } from '../../lib/positions';
import { fmtUsd, fmtPct, fmtNum } from '../../lib/format';

interface Props {
  transactions: Transaction[];
  quotes: Map<string, number>;
}

export function TopUnrealized({ transactions, quotes }: Props) {
  const [mode, setMode] = useState<'$' | '%'>('$');

  const open = useMemo(() => {
    const { positions } = buildPositions(transactions);
    return openPositions(positions);
  }, [transactions]);

  const withPnl = useMemo(() => open.map(p => {
    const cp = quotes.get(p.symbol);
    return {
      ...p,
      currentPrice: cp,
      unrealizedPnl: cp != null ? (cp - p.avgCost) * p.shares : null,
      unrealizedPct: cp != null && p.avgCost > 0 ? ((cp - p.avgCost) / p.avgCost) * 100 : null,
    };
  }), [open, quotes]);

  const priced = withPnl.filter(p => p.unrealizedPnl != null);

  const header = (
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-muted uppercase tracking-wide font-medium">Top Unrealized</span>
      {priced.length > 0 && (
        <div className="flex gap-0.5 bg-panel-2 rounded-md overflow-hidden border border-border">
          {(['$', '%'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 text-[11px] cursor-pointer ${mode === m ? 'bg-accent text-bg font-bold' : 'text-muted hover:text-text'}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (open.length === 0) {
    return (
      <div className="tj-card p-4">
        {header}
        <div className="text-muted text-xs text-center py-3">No open positions</div>
      </div>
    );
  }

  if (priced.length === 0) {
    return (
      <div className="tj-card p-4">
        {header}
        <div className="text-muted text-xs text-center leading-relaxed pt-3">
          Live prices loading via Finnhub…
        </div>
      </div>
    );
  }

  const sorted = [...priced].sort((a, b) =>
    mode === '$' ? (b.unrealizedPnl! - a.unrealizedPnl!) : (b.unrealizedPct! - a.unrealizedPct!)
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  function row(p: typeof sorted[number], label: string, color: string) {
    const val = mode === '$' ? fmtUsd(p.unrealizedPnl!) : fmtPct(p.unrealizedPct!, 1);
    return (
      <div className="flex items-center justify-between py-2 border-t border-border">
        <div>
          <div className="text-[11px] text-muted mb-0.5">{label}</div>
          <div className="font-bold text-text text-sm">{p.symbol}</div>
          <div className="text-[11px] text-muted tabular-nums">${fmtNum(p.currentPrice!, 2)} now</div>
        </div>
        <div className="text-[15px] font-bold tabular-nums" style={{ color }}>{val}</div>
      </div>
    );
  }

  return (
    <div className="tj-card p-4">
      {header}
      {best && row(best, 'Best Open', '#2edc85')}
      {worst && worst !== best && row(worst, 'Worst Open', '#f0566e')}
    </div>
  );
}
