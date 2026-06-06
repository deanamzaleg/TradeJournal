import { useState } from 'react';

export type SortDir = 'asc' | 'desc';

export function useSort(defaultCol: string, defaultDir: SortDir = 'desc') {
  const [sortCol, setSortCol] = useState(defaultCol);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  function onSort(col: string) {
    if (sortCol === col) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('desc'); }
  }

  function sortRows<T>(rows: T[], getVal: (row: T, col: string) => string | number | null): T[] {
    return [...rows].sort((a, b) => {
      const va = getVal(a, sortCol);
      const vb = getVal(b, sortCol);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  return { sortCol, sortDir, onSort, sortRows };
}

interface ThProps {
  col: string;
  label: string;
  sortCol: string;
  sortDir: SortDir;
  onSort: (col: string) => void;
  className?: string;
}

export function SortTh({ col, label, sortCol, sortDir, onSort, className = '' }: ThProps) {
  const active = sortCol === col;
  return (
    <th
      onClick={() => onSort(col)}
      className={`text-left text-xs font-medium py-2 px-3 uppercase tracking-wide cursor-pointer select-none transition-colors ${active ? 'text-accent' : 'text-muted hover:text-text'} ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`text-[8px] leading-none ${active ? 'opacity-100' : 'opacity-40'}`}>
          {active ? (sortDir === 'asc' ? '▲' : '▼') : '▼'}
        </span>
      </span>
    </th>
  );
}
