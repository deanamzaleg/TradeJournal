import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { loadJournal, saveJournal } from '../store';
import { Transaction, AssetClass, Side, QuantityMode, StopType } from '../types';

const router = Router();

router.get('/', (req, res) => {
  const { portfolioId } = req.query;
  const { transactions } = loadJournal();
  res.json(portfolioId ? transactions.filter(t => t.portfolioId === portfolioId) : transactions);
});

router.post('/', (req, res) => {
  const body = req.body as Partial<Transaction>;
  const err = validateTransaction(body);
  if (err) { res.status(400).json({ error: err }); return; }

  const journal = loadJournal();
  const t: Transaction = {
    id: uuidv4(),
    portfolioId: body.portfolioId!,
    dateTime: body.dateTime ?? new Date().toISOString(),
    symbol: body.symbol!.toUpperCase(),
    assetClass: (body.assetClass ?? 'Stocks') as AssetClass,
    side: body.side! as Side,
    price: Number(body.price),
    quantity: Number(body.quantity),
    quantityMode: (body.quantityMode ?? 'dollars') as QuantityMode,
    fee: Number(body.fee ?? 1.5),
    stop: {
      type: (body.stop?.type ?? 'none') as StopType,
      price: body.stop?.price,
      trailingPercent: body.stop?.trailingPercent,
    },
    strategy: body.strategy ?? '',
    tags: Array.isArray(body.tags) ? body.tags : [],
    notes: body.notes ?? '',
  };

  journal.transactions.push(t);
  saveJournal(journal);
  res.status(201).json(t);
});

router.put('/:id', (req, res) => {
  const journal = loadJournal();
  const idx = journal.transactions.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'not found' }); return; }

  const body = req.body as Partial<Transaction>;
  const existing = journal.transactions[idx];

  const merged: Transaction = {
    ...existing,
    ...body,
    id: existing.id,
    portfolioId: existing.portfolioId,
    symbol: (body.symbol ?? existing.symbol).toUpperCase(),
    price: Number(body.price ?? existing.price),
    quantity: Number(body.quantity ?? existing.quantity),
    fee: Number(body.fee ?? existing.fee),
    // Deep-merge stop so a partial stop in the body can't drop price/trailingPercent
    stop: body.stop ? { ...existing.stop, ...body.stop } : existing.stop,
  };

  const err = validateTransaction(merged);
  if (err) { res.status(400).json({ error: err }); return; }

  journal.transactions[idx] = merged;
  saveJournal(journal);
  res.json(merged);
});

router.delete('/:id', (req, res) => {
  const journal = loadJournal();
  const idx = journal.transactions.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'not found' }); return; }
  journal.transactions.splice(idx, 1);
  saveJournal(journal);
  res.status(204).send();
});

function validateTransaction(b: Partial<Transaction>): string | null {
  if (!b.portfolioId) return 'portfolioId required';
  if (!b.symbol?.trim()) return 'symbol required';
  if (b.side !== 'BUY' && b.side !== 'SELL') return 'side must be BUY or SELL';
  if (!b.price || Number(b.price) <= 0) return 'price must be > 0';
  if (!b.quantity || Number(b.quantity) <= 0) return 'quantity must be > 0';
  return null;
}

export default router;
