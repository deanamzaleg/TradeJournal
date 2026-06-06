import { useState, useEffect, type FormEvent } from 'react';
import type { Portfolio } from '../../types';
import { Modal } from '../ui/Modal';
import { Field, Input } from '../ui/Field';
import { Button } from '../ui/Button';
import { PORTFOLIO_COLORS, pfColor } from './PortfolioPills';

function ColorPicker({ color, setColor }: { color: string; setColor: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 pt-0.5">
      {PORTFOLIO_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => setColor(c)}
          aria-label={`Color ${c}`}
          className="w-7 h-7 rounded-full cursor-pointer transition-all shrink-0"
          style={{
            background: c,
            border: color === c ? '3px solid var(--color-text)' : '3px solid transparent',
            outline: color === c ? `2px solid ${c}` : 'none',
            outlineOffset: 2,
            boxShadow: color === c ? `0 0 10px ${c}60` : 'none',
          }}
        />
      ))}
    </div>
  );
}

function PreviewPill({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted">Preview:</span>
      <div
        className="inline-flex items-center gap-1.5 rounded-full text-xs font-bold"
        style={{ padding: '5px 12px', background: color + '18', border: `1px solid ${color}`, color }}
      >
        <span className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />
        {name || 'Portfolio name'}
      </div>
    </div>
  );
}

export function NewPortfolioModal({ open, onClose, onCreate }: {
  open: boolean; onClose: () => void; onCreate: (name: string, color: string) => Promise<void> | void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PORTFOLIO_COLORS[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setName(''); setColor(PORTFOLIO_COLORS[0]); } }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try { await onCreate(name.trim(), color); onClose(); } finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Portfolio" maxWidth="max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Portfolio Name">
          <Input placeholder="e.g. Swing Account" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Color"><ColorPicker color={color} setColor={setColor} /></Field>
        <PreviewPill name={name} color={color} />
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <button
            type="submit"
            disabled={!name.trim() || busy}
            className="rounded-lg text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ padding: '9px 22px', background: color, color: '#080b0e' }}
          >
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EditPortfolioModal({ open, onClose, portfolio, onSave, onDelete }: {
  open: boolean;
  onClose: () => void;
  portfolio: Portfolio | null;
  onSave: (id: string, name: string, color: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PORTFOLIO_COLORS[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (portfolio) { setName(portfolio.name); setColor(pfColor(portfolio)); setConfirmDelete(false); }
  }, [portfolio]);

  if (!portfolio) return null;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !portfolio) return;
    setBusy(true);
    try { await onSave(portfolio.id, name.trim(), color); onClose(); } finally { setBusy(false); }
  }

  async function del() {
    if (!portfolio) return;
    if (confirmDelete) { await onDelete(portfolio.id); onClose(); }
    else setConfirmDelete(true);
  }

  return (
    <Modal open={open} onClose={() => { setConfirmDelete(false); onClose(); }} title="Edit Portfolio" maxWidth="max-w-md">
      <form onSubmit={save} className="flex flex-col gap-4">
        <Field label="Portfolio Name">
          <Input value={name} onChange={e => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Color"><ColorPicker color={color} setColor={setColor} /></Field>
        <PreviewPill name={name} color={color} />
        <div className="border-t border-border pt-3.5 flex justify-between items-center gap-2">
          <button
            type="button"
            onClick={del}
            className="rounded-lg text-xs font-semibold cursor-pointer border transition-all whitespace-nowrap"
            style={{
              padding: '7px 14px',
              background: confirmDelete ? '#f0566e' : 'transparent',
              borderColor: confirmDelete ? '#f0566e' : 'rgba(240,86,110,0.35)',
              color: confirmDelete ? '#fff' : '#f0566e',
            }}
          >
            {confirmDelete ? '⚠ Confirm Delete' : 'Delete Portfolio'}
          </button>
          <div className="flex gap-2 items-center">
            {confirmDelete && (
              <button type="button" onClick={() => setConfirmDelete(false)} className="text-[11px] text-muted cursor-pointer">Cancel</button>
            )}
            <Button type="button" variant="secondary" onClick={() => { setConfirmDelete(false); onClose(); }}>Cancel</Button>
            <button
              type="submit"
              disabled={!name.trim() || busy}
              className="rounded-lg text-sm font-bold cursor-pointer disabled:opacity-50 transition-opacity"
              style={{ padding: '9px 22px', background: color, color: '#080b0e' }}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
