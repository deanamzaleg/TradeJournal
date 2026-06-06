import type { UnrealizedKpis as UKpis } from '../../lib/metrics';
import { fmtUsd } from '../../lib/format';
import { KpiCard } from './KpiCard';

interface Props { kpis: UKpis }

export function UnrealizedKpis({ kpis }: Props) {
  const hasOpen = kpis.openPositionCount > 0;
  const pnlColor = kpis.unrealizedPnl > 0 ? 'positive' : kpis.unrealizedPnl < 0 ? 'negative' : 'neutral';

  const unrealPnlValue = !hasOpen ? '—' : kpis.hasPrices ? fmtUsd(kpis.unrealizedPnl) : 'Loading…';
  const unrealColor: 'positive' | 'negative' | 'neutral' = !hasOpen || !kpis.hasPrices ? 'neutral' : pnlColor;

  return (
    <div className="flex flex-col gap-3">
      <img src="/Unrealized.png" alt="Unrealized" className="h-9 max-w-[260px] object-contain object-left select-none pointer-events-none" style={{ mixBlendMode: 'lighten' }} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Open Positions" value={String(kpis.openPositionCount)} />
        <KpiCard label="Market Value" value={hasOpen && kpis.hasPrices ? fmtUsd(kpis.marketValue) : '—'} />
        <KpiCard
          label="Unrealized P/L"
          value={unrealPnlValue}
          color={unrealColor}
          size="lg"
        />
      </div>
    </div>
  );
}
