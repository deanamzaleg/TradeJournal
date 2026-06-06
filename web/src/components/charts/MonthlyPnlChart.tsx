import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { fmtUsd } from '../../lib/format';
import type { MonthPnlPoint } from '../../lib/metrics';

interface Props {
  data: MonthPnlPoint[];
}

interface TipProps {
  active?: boolean;
  payload?: { payload: MonthPnlPoint }[];
}

function MonthTooltip({ active, payload }: TipProps) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const pos = d.pnl >= 0;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: '#181d24',
        border: `1px solid ${pos ? 'rgba(46,220,133,0.3)' : 'rgba(240,86,110,0.3)'}`,
        borderLeft: `3px solid ${pos ? '#2edc85' : '#f0566e'}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      <div className="text-muted mb-1">{d.label} {d.year}</div>
      <div className="font-bold text-base tabular-nums" style={{ color: pos ? '#2edc85' : '#f0566e' }}>{fmtUsd(d.pnl)}</div>
    </div>
  );
}

export function MonthlyPnlChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="tj-card p-4">
        <h3 className="text-xs text-muted uppercase tracking-wide font-medium mb-4">P/L by Month</h3>
        <div className="flex flex-col items-center justify-center gap-3 h-[200px]">
          <BarChart2 size={28} className="text-border" />
          <span className="text-muted text-sm">No closed trades yet</span>
        </div>
      </div>
    );
  }

  const maxAbs = Math.max(...data.map(d => Math.abs(d.pnl)), 1);

  return (
    <div className="tj-card p-4">
      <h3 className="text-xs text-muted uppercase tracking-wide font-medium mb-4">P/L by Month</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="40%">
          <CartesianGrid strokeDasharray="3 3" stroke="#232830" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#7a8494', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            domain={[-maxAbs, maxAbs]}
            tick={{ fill: '#7a8494', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `$${v}`}
            width={60}
          />
          <ReferenceLine y={0} stroke="#3a3f4a" strokeWidth={1.5} />
          <Tooltip content={<MonthTooltip />} cursor={{ fill: 'rgba(46,220,133,0.05)' }} />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? '#2edc85' : '#f0566e'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
