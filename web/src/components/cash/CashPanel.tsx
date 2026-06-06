import { useState } from 'react';
import type { CashDeposit, TaxEntry, Transaction } from '../../types';
import { calcCashKpis } from '../../lib/metrics';
import { fmtUsd, fmtNum, fmtDateTime } from '../../lib/format';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import { Trash2, Plus } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  deposits: CashDeposit[];
  taxEntries: TaxEntry[];
  onAddDeposit: () => void;
  onDeleteDeposit: (id: string) => void;
  onAddTax: (amount: number, note: string) => Promise<void>;
  onDeleteTax: (id: string) => void;
}

export function CashPanel({ transactions, deposits, taxEntries, onAddDeposit, onDeleteDeposit, onAddTax, onDeleteTax }: Props) {
  const kpis = calcCashKpis(transactions, deposits, taxEntries);
  const [taxAmount, setTaxAmount] = useState('');
  const [taxNote, setTaxNote] = useState('');
  const [addingTax, setAddingTax] = useState(false);
  const [showTaxForm, setShowTaxForm] = useState(false);

  async function handleAddTax() {
    const amount = Number(taxAmount);
    if (!amount || amount <= 0) return;
    setAddingTax(true);
    try {
      await onAddTax(amount, taxNote);
      setTaxAmount(''); setTaxNote(''); setShowTaxForm(false);
    } finally {
      setAddingTax(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="tj-card p-5 flex flex-col items-center text-center gap-1">
          <div className="text-xs text-muted uppercase tracking-wide">Free USD Cash</div>
          <div className={`text-2xl font-bold tabular-nums ${kpis.freeCash >= 0 ? 'text-accent' : 'text-negative'}`}>
            {fmtUsd(kpis.freeCash)}
          </div>
        </div>
        <div className="tj-card p-5 flex flex-col items-center text-center gap-1">
          <div className="text-xs text-muted uppercase tracking-wide">Avg NIS→USD Rate</div>
          <div className="text-2xl font-bold tabular-nums text-text">{fmtNum(kpis.avgFxRate, 4)}</div>
          <div className="text-xs text-muted">NIS per $1</div>
        </div>
        <div className="tj-card p-5 flex flex-col items-center text-center gap-1">
          <div className="text-xs text-muted uppercase tracking-wide">Total Deposited</div>
          <div className="text-lg font-semibold tabular-nums text-text">{fmtUsd(kpis.totalDeposited)}</div>
        </div>
        {kpis.totalWithdrawn > 0 ? (
          <div className="tj-card p-5 flex flex-col items-center text-center gap-1">
            <div className="text-xs text-muted uppercase tracking-wide">Total Withdrawn</div>
            <div className="text-lg font-semibold tabular-nums text-negative">{fmtUsd(kpis.totalWithdrawn)}</div>
          </div>
        ) : (
          <div className="tj-card p-5 flex flex-col items-center text-center gap-1">
            <div className="text-xs text-muted uppercase tracking-wide">Fees This Month</div>
            <div className={`text-lg font-semibold tabular-nums ${kpis.monthlyFees > 0 ? 'text-negative' : 'text-text'}`}>{fmtUsd(kpis.monthlyFees)}</div>
          </div>
        )}
      </div>

      {/* Cash & FX transactions table */}
      <div className="tj-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs text-muted uppercase tracking-wide font-medium">Cash &amp; FX Transactions</h3>
            <p className="text-[11px] text-muted mt-0.5">Buy USD (NIS→$) and Sell USD ($→NIS)</p>
          </div>
          <Button size="sm" variant="primary" onClick={onAddDeposit}>
            <Plus size={14} /> Add Transaction
          </Button>
        </div>
        {deposits.length === 0 ? (
          <div className="text-center text-muted text-sm py-4">No transactions yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Date', 'Type', 'Amount In', 'Rate (NIS/$)', 'Amount Out'].map(h => (
                  <th key={h} className="text-left text-xs text-muted py-2 px-3 uppercase tracking-wide">{h}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {[...deposits].reverse().map(d => {
                const isBuy = !d.direction || d.direction === 'buy_usd';
                return (
                  <tr key={d.id} className="border-b border-border/40 hover:bg-panel-2 transition-colors">
                    <td className="py-2 px-3 text-muted text-xs tabular-nums">{fmtDateTime(d.dateTime)}</td>
                    <td className="py-2 px-3">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border"
                        style={{
                          background: isBuy ? 'rgba(46,220,133,0.12)' : 'rgba(240,86,110,0.12)',
                          color: isBuy ? '#2edc85' : '#f0566e',
                          borderColor: isBuy ? 'rgba(46,220,133,0.25)' : 'rgba(240,86,110,0.25)',
                        }}
                      >
                        {isBuy ? 'BUY USD' : 'SELL USD'}
                      </span>
                    </td>
                    <td className="py-2 px-3 tabular-nums">
                      {isBuy ? <span>₪{fmtNum(d.nisAmount)}</span> : <span className="text-negative font-semibold">{fmtUsd(d.usdAmount ?? 0)}</span>}
                    </td>
                    <td className="py-2 px-3 tabular-nums text-muted">{fmtNum(d.rate, 4)}</td>
                    <td className="py-2 px-3 tabular-nums font-semibold">
                      {isBuy ? <span className="text-accent">{fmtUsd(d.usdReceived)}</span> : <span>₪{fmtNum((d.usdAmount ?? 0) * d.rate)}</span>}
                    </td>
                    <td className="py-2 px-3">
                      <button onClick={() => onDeleteDeposit(d.id)} aria-label="Delete transaction" className="p-1.5 rounded-md text-muted hover:text-negative hover:bg-negative/10"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Tax table */}
      <div className="tj-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs text-muted uppercase tracking-wide font-medium">Tax Deductions</h3>
          <Button size="sm" variant="secondary" onClick={() => setShowTaxForm(f => !f)}>
            <Plus size={14} /> Add Tax
          </Button>
        </div>
        {showTaxForm && (
          <div className="flex gap-2 mb-4">
            <Input type="number" step="0.01" min="0" placeholder="USD amount" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} className="w-32" />
            <Input placeholder="Note (optional)" value={taxNote} onChange={e => setTaxNote(e.target.value)} className="flex-1" />
            <Button variant="danger" size="sm" onClick={handleAddTax} disabled={addingTax}>
              {addingTax ? '…' : 'Add'}
            </Button>
          </div>
        )}
        {taxEntries.length === 0 ? (
          <div className="text-center text-muted text-sm py-4">No tax entries</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Date', 'USD Amount', 'Note'].map(h => (
                  <th key={h} className="text-left text-xs text-muted py-2 px-3 uppercase tracking-wide">{h}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {[...taxEntries].reverse().map(t => (
                <tr key={t.id} className="border-b border-border/40 hover:bg-panel-2 transition-colors">
                  <td className="py-2 px-3 text-muted text-xs tabular-nums">{fmtDateTime(t.dateTime)}</td>
                  <td className="py-2 px-3 tabular-nums text-negative font-semibold">{fmtUsd(t.usdAmount)}</td>
                  <td className="py-2 px-3 text-muted text-xs">{t.note || '—'}</td>
                  <td className="py-2 px-3">
                    <button onClick={() => onDeleteTax(t.id)} aria-label="Delete tax entry" className="p-1.5 rounded-md text-muted hover:text-negative hover:bg-negative/10"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
