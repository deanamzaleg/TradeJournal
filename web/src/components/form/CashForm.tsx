import { useState, useEffect, type FormEvent } from 'react';
import type { FxDirection } from '../../types';
import { Modal } from '../ui/Modal';
import { Field, Input } from '../ui/Field';
import { Button } from '../ui/Button';

interface CashFormProps {
  open: boolean;
  onClose: () => void;
  portfolioId: string;
  onSubmit: (payload: { direction: FxDirection; rate: number; nisAmount?: number; usdAmount?: number }) => Promise<void>;
}

export function CashForm({ open, onClose, portfolioId: _portfolioId, onSubmit }: CashFormProps) {
  const [direction, setDirection] = useState<FxDirection>('buy_usd');
  const [nisAmount, setNisAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [rate, setRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setNisAmount(''); setUsdAmount(''); setRate(''); setError('');
  }, [open]);

  const isBuy = direction === 'buy_usd';
  const usdPreview = isBuy && nisAmount && rate && Number(rate) > 0 ? (Number(nisAmount) / Number(rate)).toFixed(2) : null;
  const nisPreview = !isBuy && usdAmount && rate && Number(rate) > 0 ? (Number(usdAmount) * Number(rate)).toFixed(2) : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const r = Number(rate);
    if (!r || r <= 0) { setError('Exchange rate must be > 0'); return; }

    if (isBuy) {
      const nis = Number(nisAmount);
      if (!nis || nis <= 0) { setError('NIS amount must be > 0'); return; }
      setSubmitting(true);
      try { await onSubmit({ direction: 'buy_usd', nisAmount: nis, rate: r }); onClose(); }
      catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
      finally { setSubmitting(false); }
    } else {
      const usd = Number(usdAmount);
      if (!usd || usd <= 0) { setError('USD amount must be > 0'); return; }
      setSubmitting(true);
      try { await onSubmit({ direction: 'sell_usd', usdAmount: usd, rate: r }); onClose(); }
      catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
      finally { setSubmitting(false); }
    }
  }

  const dirBtn = (val: FxDirection, label: string, color: string) => (
    <button
      type="button"
      onClick={() => setDirection(val)}
      className="flex-1 rounded-lg text-sm font-semibold cursor-pointer border transition-all"
      style={{
        padding: '9px 0',
        background: direction === val ? color : 'var(--color-panel-2)',
        color: direction === val ? (val === 'buy_usd' ? '#080b0e' : '#fff') : 'var(--color-muted)',
        borderColor: direction === val ? color : 'var(--color-border)',
      }}
    >
      {label}
    </button>
  );

  return (
    <Modal open={open} onClose={onClose} title="Cash & FX Transaction">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          {dirBtn('buy_usd', '+ Buy USD (NIS → $)', '#2edc85')}
          {dirBtn('sell_usd', '− Sell USD ($ → NIS)', '#f0566e')}
        </div>

        {isBuy ? (
          <Field label="NIS Amount (₪)">
            <Input type="number" step="0.01" min="0" placeholder="10000.00" value={nisAmount} onChange={e => setNisAmount(e.target.value)} />
          </Field>
        ) : (
          <Field label="USD Amount ($)">
            <Input type="number" step="0.01" min="0" placeholder="3000.00" value={usdAmount} onChange={e => setUsdAmount(e.target.value)} />
          </Field>
        )}

        <Field label="NIS → USD Rate" hint="NIS per $1">
          <Input type="number" step="0.0001" min="0" placeholder="3.70" value={rate} onChange={e => setRate(e.target.value)} />
        </Field>

        {usdPreview && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-muted text-sm">USD received</span>
            <span className="text-accent font-bold text-lg tabular-nums">${usdPreview}</span>
          </div>
        )}
        {nisPreview && (
          <div className="bg-negative/10 border border-negative/20 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-muted text-sm">NIS received</span>
            <span className="text-negative font-bold text-lg tabular-nums">₪{nisPreview}</span>
          </div>
        )}

        {error && <p className="text-negative text-sm">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={isBuy ? 'primary' : 'danger'} disabled={submitting}>
            {submitting ? 'Saving…' : isBuy ? 'Add Deposit' : 'Record Withdrawal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
