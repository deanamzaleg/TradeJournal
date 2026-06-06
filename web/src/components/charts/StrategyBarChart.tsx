import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { fmtUsd } from '../../lib/format';

interface Props {
  data: { strategy: string; pnl: number; trades: number }[];
}

export function StrategyBarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="tj-card p-4 flex flex-col items-center justify-center gap-3 h-[240px]">
        <BarChart2 size={28} className="text-border" />
        <span className="text-muted text-sm">No strategy data yet</span>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.pnl - a.pnl);

  return (
    <div className="tj-card p-4">
      <h3 className="text-xs text-muted uppercase tracking-wide font-medium mb-4">P/L by Strategy</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={sorted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232830" vertical={false} />
          <XAxis dataKey="strategy" tick={{ fill: '#7a8494', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#7a8494', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={60} />
          <Tooltip
            contentStyle={{ background: '#181d24', border: '1px solid #232830', borderRadius: 8, color: '#f0f3f7', fontSize: 12 }}
            formatter={(v) => [fmtUsd(Number(v)), 'P/L']}
          />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {sorted.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? '#2edc85' : '#f0566e'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
