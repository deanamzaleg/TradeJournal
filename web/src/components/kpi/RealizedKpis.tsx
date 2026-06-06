import type { RealizedKpis as RKpis } from '../../lib/metrics';
import { fmtUsd, fmtPct, fmtNum } from '../../lib/format';
import { KpiCard } from './KpiCard';

interface Props { kpis: RKpis }

export function RealizedKpis({ kpis }: Props) {
  const noTrades = kpis.totalClosedTrades === 0;
  const pnlColor = kpis.netRealizedPnl > 0 ? 'positive' : kpis.netRealizedPnl < 0 ? 'negative' : 'neutral';

  return (
    <div className="flex flex-col gap-3">
      <img src="/Realized.png" alt="Realized" className="h-9 max-w-[260px] object-contain object-left select-none pointer-events-none" style={{ mixBlendMode: 'lighten' }} />
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3">
          <KpiCard label="Net Realized P/L" value={fmtUsd(kpis.netRealizedPnl)} color={pnlColor} size="lg" prominent />
        </div>
        <KpiCard
          label="Win Rate"
          value={noTrades ? '—' : fmtPct(kpis.winRate * 100, 1)}
          color={noTrades ? 'neutral' : kpis.winRate >= 0.5 ? 'positive' : 'negative'}
        />
        <KpiCard label="Closed Trades" value={String(kpis.totalClosedTrades)} />
        <KpiCard
          label="Profit Factor"
          value={noTrades ? '—' : isFinite(kpis.profitFactor) ? fmtNum(kpis.profitFactor) : '∞'}
          color={noTrades ? 'neutral' : kpis.profitFactor >= 1 ? 'positive' : 'negative'}
        />
        <KpiCard
          label="Avg Win"
          value={kpis.avgWin === 0 ? '—' : fmtUsd(kpis.avgWin)}
          color={kpis.avgWin === 0 ? 'neutral' : 'positive'}
        />
        <KpiCard
          label="Avg Loss"
          value={kpis.avgLoss === 0 ? '—' : fmtUsd(kpis.avgLoss)}
          color={kpis.avgLoss === 0 ? 'neutral' : 'negative'}
        />
        <KpiCard
          label="Expectancy"
          value={noTrades ? '—' : fmtUsd(kpis.expectancy)}
          color={noTrades ? 'neutral' : kpis.expectancy > 0 ? 'positive' : kpis.expectancy < 0 ? 'negative' : 'neutral'}
        />
        <KpiCard
          label="Max Drawdown"
          value={kpis.maxDrawdown === 0 ? '—' : fmtUsd(kpis.maxDrawdown)}
          color={kpis.maxDrawdown === 0 ? 'neutral' : 'negative'}
        />
        <KpiCard
          label="W/L Streak"
          value={noTrades ? '—' : `W${kpis.currentWinStreak} / L${kpis.currentLossStreak}`}
          subvalue={noTrades ? undefined : `Best: W${kpis.longestWinStreak} / L${kpis.longestLossStreak}`}
        />
      </div>
    </div>
  );
}
