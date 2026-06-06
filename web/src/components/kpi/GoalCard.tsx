import { useState } from 'react';
import { fmtUsd } from '../../lib/format';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';

function loadGoal(): number {
  try { return Number(localStorage.getItem('tj-goal') || 1000); } catch { return 1000; }
}
function saveGoal(n: number) {
  try { localStorage.setItem('tj-goal', String(n)); } catch {}
}

interface GoalCardProps {
  realizedPnl: number;
}

export function GoalCard({ realizedPnl }: GoalCardProps) {
  const [target, setTarget] = useState(loadGoal);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function applyTarget() {
    const n = Number(draft);
    if (n > 0) { setTarget(n); saveGoal(n); }
    setEditing(false);
  }

  const pct = target > 0 ? Math.min(100, Math.max(0, (realizedPnl / target) * 100)) : 0;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const ringColor = realizedPnl > 0 ? '#2edc85' : realizedPnl < 0 ? '#f0566e' : '#232830';

  return (
    <div className="tj-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted uppercase tracking-wide font-medium">Monthly Goal</span>
        {!editing ? (
          <button
            onClick={() => { setDraft(String(target)); setEditing(true); }}
            className="text-xs text-muted hover:text-accent cursor-pointer transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <Input value={draft} onChange={e => setDraft(e.target.value)} className="w-24 py-1 text-xs" />
            <Button size="sm" variant="primary" onClick={applyTarget}>Set</Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg width={96} height={96} viewBox="0 0 96 96">
            <circle cx={48} cy={48} r={r} fill="none" stroke="#232830" strokeWidth={8} />
            <circle
              cx={48} cy={48} r={r}
              fill="none"
              stroke={ringColor}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold tabular-nums" style={{ color: ringColor }}>
              {pct.toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span
            className="text-xl font-bold tabular-nums"
            style={{ color: realizedPnl > 0 ? '#2edc85' : realizedPnl < 0 ? '#f0566e' : 'var(--color-muted)' }}
          >
            {fmtUsd(realizedPnl)}
          </span>
          <span className="text-xs text-muted">of {fmtUsd(target)} target</span>
        </div>
      </div>
    </div>
  );
}
