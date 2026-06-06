import type { AssetClass } from '../../types';
import { X } from 'lucide-react';

const ASSET_CLASSES: AssetClass[] = ['Stocks', 'Crypto', 'Options', 'Futures'];

interface Props {
  assetFilter: string;
  setAssetFilter: (v: string) => void;
  strategyFilter: string;
  setStrategyFilter: (v: string) => void;
  tagFilter: string;
  setTagFilter: (v: string) => void;
  allStrategies: string[];
  allTags: string[];
}

const selectCls =
  'bg-panel-2 border border-border rounded-lg pl-3 pr-8 py-1.5 text-xs text-text cursor-pointer focus:outline-none focus:border-accent appearance-none';

export function FilterBar({
  assetFilter, setAssetFilter,
  strategyFilter, setStrategyFilter,
  tagFilter, setTagFilter,
  allStrategies, allTags,
}: Props) {
  const active = assetFilter !== 'all' || strategyFilter !== 'all' || tagFilter !== 'all';

  function reset() {
    setAssetFilter('all');
    setStrategyFilter('all');
    setTagFilter('all');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted uppercase tracking-wide font-medium mr-1">Filter</span>

      <label className="sr-only" htmlFor="filter-asset">Asset class</label>
      <select id="filter-asset" value={assetFilter} onChange={e => setAssetFilter(e.target.value)} className={selectCls}>
        <option value="all">All assets</option>
        {ASSET_CLASSES.map(a => <option key={a} value={a}>{a}</option>)}
      </select>

      <label className="sr-only" htmlFor="filter-strategy">Strategy</label>
      <select id="filter-strategy" value={strategyFilter} onChange={e => setStrategyFilter(e.target.value)} className={selectCls} disabled={allStrategies.length === 0}>
        <option value="all">All strategies</option>
        {allStrategies.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <label className="sr-only" htmlFor="filter-tag">Tag</label>
      <select id="filter-tag" value={tagFilter} onChange={e => setTagFilter(e.target.value)} className={selectCls} disabled={allTags.length === 0}>
        <option value="all">All tags</option>
        {allTags.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      {active && (
        <button
          onClick={reset}
          className="flex items-center gap-1 text-xs text-muted hover:text-text transition-colors cursor-pointer px-2 py-1.5 rounded-lg"
        >
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
}
