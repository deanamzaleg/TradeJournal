import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import type { Portfolio } from '../../types';

export const PORTFOLIO_COLORS = [
  '#2edc85', '#25c975', '#3b82f6', '#60a5fa',
  '#a855f7', '#f59e0b', '#f0566e', '#ec4899',
  '#06b6d4', '#ff6b35', '#e2e8f0', '#94a3b8',
];

export const pfColor = (pf: Portfolio) => pf.color || '#2edc85';

interface PillProps {
  pf: Portfolio;
  active: boolean;
  onSelect: (id: string) => void;
  onEdit: (pf: Portfolio) => void;
}

function PortfolioPill({ pf, active, onSelect, onEdit }: PillProps) {
  const [hov, setHov] = useState(false);
  const col = pfColor(pf);
  const lit = active || hov;
  return (
    <div className="relative inline-flex items-center" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <button
        onClick={() => onSelect(pf.id)}
        className="flex items-center gap-1.5 rounded-full text-xs cursor-pointer border transition-all whitespace-nowrap"
        style={{
          padding: lit ? '5px 28px 5px 12px' : '5px 12px',
          fontWeight: active ? 700 : 500,
          background: active ? col + '18' : hov ? col + '0e' : 'transparent',
          borderColor: lit ? col : 'var(--color-border)',
          color: lit ? col : 'var(--color-muted)',
        }}
      >
        <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: col }} />
        {pf.name}
      </button>
      {lit && (
        <button
          onClick={e => { e.stopPropagation(); onEdit(pf); }}
          title="Edit portfolio"
          aria-label={`Edit ${pf.name}`}
          className="absolute right-[7px] top-1/2 -translate-y-1/2 w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-colors"
          style={{ background: col + '28', color: col }}
        >
          <Pencil size={9} />
        </button>
      )}
    </div>
  );
}

interface Props {
  portfolios: Portfolio[];
  activeId: string | null;
  setActiveId: (id: string) => void;
  onCreate: () => void;
  onEdit: (pf: Portfolio) => void;
}

export function PortfolioPills({ portfolios, activeId, setActiveId, onCreate, onEdit }: Props) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {portfolios.map(pf => (
        <PortfolioPill key={pf.id} pf={pf} active={pf.id === activeId} onSelect={setActiveId} onEdit={onEdit} />
      ))}
      <button
        onClick={onCreate}
        title="New portfolio"
        aria-label="New portfolio"
        className="w-7 h-7 rounded-full border border-dashed border-border text-muted hover:text-accent hover:border-accent hover:border-solid transition-colors cursor-pointer flex items-center justify-center shrink-0"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
