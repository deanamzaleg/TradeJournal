import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: 'positive' | 'negative' | 'accent' | 'muted' | 'buy';
}

const colorMap: Record<string, string> = {
  positive: 'bg-positive/10 text-positive',
  negative: 'bg-negative/10 text-negative',
  accent: 'bg-accent/10 text-accent',
  muted: 'bg-border/50 text-muted',
  buy: 'bg-buy/10 text-buy',
};

export function Badge({ children, color = 'muted' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorMap[color]}`}>
      {children}
    </span>
  );
}
