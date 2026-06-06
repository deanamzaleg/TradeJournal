import type { Portfolio } from '../../types';
import { Button } from '../ui/Button';
import { PortfolioPills } from './PortfolioPills';
import type { PeriodKey } from '../../hooks/useJournal';

interface TopbarProps {
  portfolios: Portfolio[];
  activeId: string | null;
  setActiveId: (id: string) => void;
  onCreatePortfolio: () => void;
  onEditPortfolio: (pf: Portfolio) => void;
  period: PeriodKey;
  setPeriod: (p: PeriodKey) => void;
  onBuy: () => void;
  onSell: () => void;
}

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'all', label: 'All Time' },
];

export function Topbar({ portfolios, activeId, setActiveId, onCreatePortfolio, onEditPortfolio, period, setPeriod, onBuy, onSell }: TopbarProps) {
  return (
    <header className="h-14 border-b border-border bg-panel flex-shrink-0">
      <div className="h-full flex items-center px-12 gap-4 max-w-[1320px] mx-auto">
      <PortfolioPills
        portfolios={portfolios}
        activeId={activeId}
        setActiveId={setActiveId}
        onCreate={onCreatePortfolio}
        onEdit={onEditPortfolio}
      />

      <div className="flex-1" />

      {/* Period selector */}
      <div className="flex items-center gap-1 bg-panel-2 rounded-lg p-1">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
              period === p.key ? 'bg-accent text-bg font-semibold' : 'text-muted hover:text-text hover:bg-panel'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Trade buttons */}
      <Button variant="ghost" size="md" onClick={onSell} className="font-semibold text-negative border border-negative/30 hover:bg-negative/10 hover:border-negative">
        SELL
      </Button>
      <Button variant="primary" size="md" onClick={onBuy}>
        BUY
      </Button>
      </div>
    </header>
  );
}
