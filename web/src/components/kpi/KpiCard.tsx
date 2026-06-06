import { useState } from 'react';

const colorMap: Record<string, string> = {
  positive: 'text-positive',
  negative: 'text-negative',
  accent: 'text-accent',
  neutral: 'text-text',
};

const stripColor: Record<string, string> = {
  positive: '#2edc85',
  negative: '#f0566e',
  accent: '#2edc85',
  neutral: 'rgba(46,220,133,0.18)',
};

interface KpiCardProps {
  label: string;
  value: string;
  subvalue?: string;
  color?: 'positive' | 'negative' | 'accent' | 'neutral';
  size?: 'sm' | 'lg';
  prominent?: boolean;
}

export function KpiCard({ label, value, subvalue, color = 'neutral', size = 'sm', prominent = false }: KpiCardProps) {
  const [hov, setHov] = useState(false);
  const strip = stripColor[color];

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="bg-panel border border-border rounded-xl flex flex-col gap-1 cursor-default"
      style={{
        padding: prominent ? '20px 20px' : '14px 16px',
        borderLeft: `3px solid ${strip}`,
        boxShadow: hov ? `0 0 22px ${color === 'negative' ? 'rgba(240,86,110,0.12)' : 'rgba(46,220,133,0.12)'}` : 'none',
        transition: 'box-shadow 220ms ease',
      }}
    >
      <span className="text-xs text-muted uppercase tracking-wide font-medium">{label}</span>
      <span className={`tabular-nums font-bold ${prominent ? 'text-3xl' : size === 'lg' ? 'text-2xl' : 'text-lg'} ${colorMap[color]}`}>
        {value}
      </span>
      {subvalue && <span className="text-xs text-muted tabular-nums">{subvalue}</span>}
    </div>
  );
}
