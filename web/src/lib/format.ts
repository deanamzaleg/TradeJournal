export function fmtUsd(n: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function fmtPct(n: number, decimals = 2): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(decimals)}%`;
}

export function fmtNum(n: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function fmtShares(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(n);
}

export function colorClass(n: number): string {
  if (n > 0) return 'text-positive';
  if (n < 0) return 'text-negative';
  return 'text-muted';
}
