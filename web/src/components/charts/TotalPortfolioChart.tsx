import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { fmtUsd } from '../../lib/format';
import type { PortfolioDayPoint } from '../../lib/metrics';

interface Props {
  data: PortfolioDayPoint[];
}

const COLOR = '#2edc85';

interface TipProps {
  active?: boolean;
  payload?: { payload: PortfolioDayPoint }[];
}

function TotalTooltip({ active, payload }: TipProps) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{ background: '#181d24', border: '1px solid #232830', borderLeft: `3px solid ${COLOR}`, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
    >
      <div className="text-muted mb-1">{d.label}</div>
      <div className="font-bold text-[15px] tabular-nums" style={{ color: COLOR }}>{fmtUsd(d.value)}</div>
      <div className="mt-1 flex flex-col gap-0.5 text-muted">
        <span>Open positions: {fmtUsd(d.openCost)}</span>
        <span style={{ color: d.realizedPnl >= 0 ? '#2edc85' : '#f0566e' }}>Realized P/L: {fmtUsd(d.realizedPnl)}</span>
      </div>
    </div>
  );
}

export function TotalPortfolioChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="tj-card p-4 flex flex-col items-center justify-center gap-3 h-[252px]">
        <TrendingUp size={28} className="text-border" />
        <span className="text-muted text-sm">No transactions yet</span>
      </div>
    );
  }

  return (
    <div className="tj-card p-4">
      <h3 className="text-xs text-muted uppercase tracking-wide font-medium mb-4">Total Portfolio ($) by Day</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="tjPortGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR} stopOpacity={0.22} />
              <stop offset="100%" stopColor={COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#232830" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#7a8494', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: '#7a8494', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={60} />
          <Tooltip content={<TotalTooltip />} />
          <Area type="monotone" dataKey="value" stroke={COLOR} fill="url(#tjPortGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
