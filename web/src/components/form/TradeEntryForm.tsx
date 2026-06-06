import { useState, useEffect, useMemo, useRef, type FormEvent } from 'react';
import { Pencil, Plus, Check, X } from 'lucide-react';
import type { Transaction, Side, AssetClass, QuantityMode, StopType } from '../../types';
import { buildPositions } from '../../lib/positions';
import { fmtUsd, fmtShares } from '../../lib/format';
import { Modal } from '../ui/Modal';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { Button } from '../ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultSide: Side;
  defaultSymbol?: string;
  portfolioId: string;
  onSubmit: (t: Omit<Transaction, 'id'>) => Promise<void>;
  editTx?: Transaction | null;
  transactions?: Transaction[];
}

const ASSET_CLASSES: AssetClass[] = ['Stocks', 'Crypto', 'Options', 'Futures'];

// ── Strategy dropdown with + New ─────────────────────────────────────────────
function StrategySelect({ value, onChange, known }: {
  value: string;
  onChange: (v: string) => void;
  known: string[];
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  function confirmNew() {
    const v = draft.trim();
    if (v) onChange(v);
    setAdding(false);
    setDraft('');
  }

  function cancelNew() { setAdding(false); setDraft(''); }

  if (adding) {
    return (
      <div className="flex gap-1">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmNew(); } if (e.key === 'Escape') cancelNew(); }}
          placeholder="New strategy name…"
          className="flex-1 bg-panel-2 border border-accent rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none"
        />
        <button type="button" onClick={confirmNew} className="p-2 rounded-lg bg-accent text-bg hover:bg-accent-hover cursor-pointer"><Check size={14} /></button>
        <button type="button" onClick={cancelNew} className="p-2 rounded-lg bg-panel-2 border border-border text-muted hover:text-text cursor-pointer"><X size={14} /></button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-panel-2 border border-border rounded-lg px-3 py-2 text-sm text-text cursor-pointer focus:outline-none focus:border-accent appearance-none"
      >
        <option value="">— select strategy —</option>
        {known.map(s => <option key={s} value={s}>{s}</option>)}
        {value && !known.includes(value) && <option value={value}>{value}</option>}
      </select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        title="Add new strategy"
        className="px-2.5 py-2 rounded-lg bg-panel-2 border border-border text-muted hover:text-accent hover:border-accent/50 cursor-pointer transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ── Tags pills with + New ─────────────────────────────────────────────────────
function TagsSelect({ selected, onChange, known }: {
  selected: string[];
  onChange: (tags: string[]) => void;
  known: string[];
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  function toggle(tag: string) {
    onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]);
  }

  function confirmNew() {
    const v = draft.trim();
    if (v && !selected.includes(v)) onChange([...selected, v]);
    setAdding(false);
    setDraft('');
  }

  function cancelNew() { setAdding(false); setDraft(''); }

  // All tags to show as pills = known ∪ selected (so selected-but-not-known still show)
  const allTags = [...new Set([...known, ...selected])];

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[34px]">
      {allTags.map(tag => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
              active
                ? 'bg-accent text-bg border-accent'
                : 'bg-panel-2 border-border text-muted hover:text-text hover:border-accent/40'
            }`}
          >
            {tag}
          </button>
        );
      })}

      {adding ? (
        <>
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmNew(); } if (e.key === 'Escape') cancelNew(); }}
            placeholder="New tag…"
            className="w-28 bg-panel-2 border border-accent rounded-full px-2.5 py-1 text-xs text-text placeholder:text-muted focus:outline-none"
          />
          <button type="button" onClick={confirmNew} className="p-1 rounded-full bg-accent text-bg hover:bg-accent-hover cursor-pointer"><Check size={11} /></button>
          <button type="button" onClick={cancelNew} className="p-1 rounded-full bg-panel-2 border border-border text-muted hover:text-text cursor-pointer"><X size={11} /></button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          title="Add new tag"
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs border border-dashed border-border text-muted hover:text-accent hover:border-accent/50 cursor-pointer transition-colors"
        >
          <Plus size={11} /> tag
        </button>
      )}
    </div>
  );
}

// ── Read-only field for SELL prefill ─────────────────────────────────────────
function ReadOnlyInfoField({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  const empty = !value.trim();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted uppercase tracking-wide">{label}</label>
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors cursor-pointer">
          <Pencil size={10} /> Edit
        </button>
      </div>
      <div className={`bg-panel-2 border border-border rounded-lg px-3 py-2 text-sm min-h-[38px] leading-relaxed ${empty ? 'text-border italic' : 'text-text'}`}>
        {empty ? '—' : value}
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
export function TradeEntryForm({ open, onClose, defaultSide, defaultSymbol, portfolioId, onSubmit, editTx, transactions }: Props) {
  const [side, setSide] = useState<Side>(defaultSide);
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [symbol, setSymbol] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass>('Stocks');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('200');
  const [quantityMode, setQuantityMode] = useState<QuantityMode>('dollars');
  const [fee, setFee] = useState('1.5');
  const [stopType, setStopType] = useState<StopType>('none');
  const [stopPrice, setStopPrice] = useState('');
  const [stopTrailingPct, setStopTrailingPct] = useState('');
  const [strategy, setStrategy] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [editStrategy, setEditStrategy] = useState(false);
  const [editTags, setEditTags] = useState(false);
  const [editNotes, setEditNotes] = useState(false);

  const isSell = side === 'SELL';

  // Derive known strategies and tags from all past transactions
  const knownStrategies = useMemo(() => {
    if (!transactions) return [];
    return [...new Set(transactions.map(t => t.strategy).filter(Boolean))].sort();
  }, [transactions]);

  const knownTags = useMemo(() => {
    if (!transactions) return [];
    return [...new Set(transactions.flatMap(t => t.tags))].sort();
  }, [transactions]);

  // Most recent BUY for SELL prefill
  const buyData = useMemo(() => {
    if (!symbol || !transactions) return null;
    const sym = symbol.toUpperCase().trim();
    const buys = transactions.filter(t => t.side === 'BUY' && t.symbol === sym);
    return buys.length ? buys[buys.length - 1] : null;
  }, [symbol, transactions]);

  // Current open position for the entered symbol (used in SELL mode)
  const openPosition = useMemo(() => {
    if (!symbol || !transactions || !isSell) return null;
    const sym = symbol.toUpperCase().trim();
    const { positions } = buildPositions(transactions);
    const pos = positions.get(sym);
    return pos && pos.shares * pos.avgCost >= 0.05 ? pos : null;
  }, [symbol, transactions, isSell]);

  useEffect(() => {
    if (!open) return;
    setEditStrategy(false);
    setEditTags(false);
    setEditNotes(false);
    if (editTx) {
      setSide(editTx.side);
      setDateTime(editTx.dateTime.slice(0, 16));
      setSymbol(editTx.symbol);
      setAssetClass(editTx.assetClass);
      setPrice(String(editTx.price));
      setQuantity(String(editTx.quantity));
      setQuantityMode(editTx.quantityMode);
      setFee(String(editTx.fee));
      setStopType(editTx.stop.type);
      setStopPrice(String(editTx.stop.price ?? ''));
      setStopTrailingPct(String(editTx.stop.trailingPercent ?? ''));
      setStrategy(editTx.strategy);
      setTags(editTx.tags);
      setNotes(editTx.notes);
    } else {
      setSide(defaultSide);
      setDateTime(new Date().toISOString().slice(0, 16));
      setSymbol(defaultSymbol ?? '');
      setAssetClass('Stocks');
      setPrice('');
      setQuantity('200');
      setQuantityMode('dollars');
      setFee('1.5');
      setStopType('none');
      setStopPrice('');
      setStopTrailingPct('');
      setStrategy('');
      setTags([]);
      setNotes('');
      setError('');
    }
  }, [open, editTx, defaultSide]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!symbol.trim()) { setError('Symbol required'); return; }
    if (!price || Number(price) <= 0) { setError('Price must be > 0'); return; }
    if (!quantity || Number(quantity) <= 0) { setError('Quantity must be > 0'); return; }

    const tx: Omit<Transaction, 'id'> = {
      portfolioId,
      dateTime: new Date(dateTime).toISOString(),
      symbol: symbol.toUpperCase().trim(),
      assetClass,
      side,
      price: Number(price),
      quantity: Number(quantity),
      quantityMode,
      fee: fee !== '' && !isNaN(Number(fee)) ? Number(fee) : 1.5,
      stop: {
        type: stopType,
        price: stopType === 'fixed' ? Number(stopPrice) : undefined,
        trailingPercent: stopType === 'trailing' ? Number(stopTrailingPct) : undefined,
      },
      strategy: (isSell && !editTx && !editStrategy) ? (buyData?.strategy ?? '') : strategy.trim(),
      tags: (isSell && !editTx && !editTags) ? (buyData?.tags ?? []) : tags,
      notes: (isSell && !editTx && !editNotes) ? (buyData?.notes ?? '') : notes.trim(),
    };

    setSubmitting(true);
    try {
      await onSubmit(tx);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editTx ? 'Edit Trade' : `New ${side} Trade`} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-negative text-sm bg-negative/10 border border-negative/30 rounded-lg px-3 py-2">{error}</p>}
        {!editTx && (
          <div className="flex gap-2">
            {(['BUY', 'SELL'] as Side[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  side === s
                    ? s === 'BUY' ? 'bg-buy text-white' : 'bg-negative text-white'
                    : 'bg-panel-2 text-muted hover:text-text border border-border'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date & Time">
            <Input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} />
          </Field>
          <Field label="Symbol">
            <Input placeholder="AAPL" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} style={{ textTransform: 'uppercase' }} />
          </Field>
          <Field label="Asset Class">
            <Select value={assetClass} onChange={e => setAssetClass(e.target.value as AssetClass)}>
              {ASSET_CLASSES.map(a => <option key={a}>{a}</option>)}
            </Select>
          </Field>
          <Field label="Price (USD)">
            <Input type="number" step="0.01" min="0" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
          </Field>
          <Field label="Quantity">
            <div className="flex gap-1">
              <Input type="number" step="0.01" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} className="flex-1" />
              <div className="flex bg-panel-2 border border-border rounded-lg overflow-hidden">
                {(['dollars', 'shares'] as QuantityMode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setQuantityMode(m)}
                    className={`px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${quantityMode === m ? 'bg-accent text-bg font-semibold' : 'text-muted hover:text-text hover:bg-panel'}`}
                  >
                    {m === 'dollars' ? '$' : 'sh'}
                  </button>
                ))}
              </div>
            </div>
          </Field>
          <Field label="Fee (USD)">
            <Input type="number" step="0.01" min="0" value={fee} onChange={e => setFee(e.target.value)} />
          </Field>
        </div>

        {/* Open position info + Sell All (SELL mode only) */}
        {isSell && openPosition && (
          <div className="flex items-center justify-between bg-panel-2 border border-border rounded-lg px-3 py-2 text-xs">
            <span className="text-muted">
              Open: <span className="text-text font-semibold tabular-nums">{fmtShares(openPosition.shares)} sh</span>
              {' '}@ <span className="text-text font-semibold tabular-nums">{fmtUsd(openPosition.avgCost)}</span> avg
              {' '}= <span className="text-text font-semibold tabular-nums">{fmtUsd(openPosition.shares * openPosition.avgCost)}</span>
            </span>
            <button
              type="button"
              onClick={() => { setQuantity(String(openPosition.shares)); setQuantityMode('shares'); }}
              className="px-2.5 py-1 rounded-md bg-accent text-bg text-xs font-semibold hover:bg-accent-hover cursor-pointer transition-colors"
            >
              Sell All
            </button>
          </div>
        )}

        <Field label="Stop Loss">
          <div className="flex gap-2">
            {(['none', 'fixed', 'trailing'] as StopType[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStopType(s)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer capitalize ${stopType === s ? 'bg-accent text-bg font-semibold' : 'bg-panel-2 text-muted border border-border hover:text-text hover:border-accent/40'}`}
              >
                {s}
              </button>
            ))}
          </div>
          {stopType === 'fixed' && (
            <Input type="number" step="0.01" placeholder="Stop price" value={stopPrice} onChange={e => setStopPrice(e.target.value)} className="mt-2" />
          )}
          {stopType === 'trailing' && (
            <Input type="number" step="0.1" placeholder="Trailing %" value={stopTrailingPct} onChange={e => setStopTrailingPct(e.target.value)} className="mt-2" />
          )}
        </Field>

        {/* Strategy */}
        {isSell && !editTx && !editStrategy ? (
          <ReadOnlyInfoField
            label="Strategy"
            value={strategy || buyData?.strategy || ''}
            onEdit={() => { setStrategy(strategy || buyData?.strategy || ''); setEditStrategy(true); }}
          />
        ) : (
          <Field label="Strategy">
            <StrategySelect value={strategy} onChange={setStrategy} known={knownStrategies} />
          </Field>
        )}

        {/* Tags */}
        {isSell && !editTx && !editTags ? (
          <ReadOnlyInfoField
            label="Tags"
            value={tags.length ? tags.join(', ') : (buyData?.tags?.length ? buyData.tags.join(', ') : '')}
            onEdit={() => { setTags(tags.length ? tags : (buyData?.tags ?? [])); setEditTags(true); }}
          />
        ) : (
          <Field label="Tags">
            <TagsSelect selected={tags} onChange={setTags} known={knownTags} />
          </Field>
        )}

        {/* Notes */}
        {isSell && !editTx && !editNotes ? (
          <ReadOnlyInfoField
            label="Notes"
            value={notes || buyData?.notes || ''}
            onEdit={() => { setNotes(notes || buyData?.notes || ''); setEditNotes(true); }}
          />
        ) : (
          <Field label="Notes">
            <Textarea rows={3} placeholder="Psychology, observations..." value={notes} onChange={e => setNotes(e.target.value)} />
          </Field>
        )}

        <div className="flex gap-3 justify-end pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className={side === 'SELL' ? '!bg-negative !text-white hover:!opacity-90' : ''}
          >
            {submitting ? 'Saving…' : editTx ? 'Save Changes' : `Submit ${side}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
