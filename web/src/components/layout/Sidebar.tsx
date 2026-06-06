import { BarChart2, Calendar, DollarSign, List, TrendingUp } from 'lucide-react';

export type View = 'dashboard' | 'calendar' | 'trades' | 'cash';


interface SidebarProps {
  view: View;
  setView: (v: View) => void;
}

const NAV = [
  { id: 'dashboard' as View, label: 'Dashboard', icon: TrendingUp },
  { id: 'calendar' as View, label: 'Calendar', icon: Calendar },
  { id: 'trades' as View, label: 'Trades', icon: List },
  { id: 'cash' as View, label: 'Cash & FX', icon: DollarSign },
];

export function Sidebar({ view, setView }: SidebarProps) {
  return (
    <aside className="w-56 flex-shrink-0 bg-panel border-r border-border flex flex-col py-6">
      <div className="px-5 mb-8">
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-accent" />
          <span className="text-text tracking-wider" style={{ fontWeight: 800, fontSize: 23 }}>TradeJournal</span>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
              view === id
                ? 'bg-accent/10 text-accent font-semibold pl-[10px] border-l-2 border-accent'
                : 'text-muted hover:text-text hover:bg-panel-2 px-3'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
