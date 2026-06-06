import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { loadJournal, saveJournal } from '../store';
import { CashDeposit, TaxEntry } from '../types';

const router = Router();

// --- Cash Deposits ---

router.get('/deposits', (req, res) => {
  const { portfolioId } = req.query;
  const { cashDeposits } = loadJournal();
  res.json(portfolioId ? cashDeposits.filter(c => c.portfolioId === portfolioId) : cashDeposits);
});

router.post('/deposits', (req, res) => {
  const { portfolioId, direction, nisAmount, usdAmount, rate, dateTime } = req.body as Partial<CashDeposit>;
  if (!portfolioId) { res.status(400).json({ error: 'portfolioId required' }); return; }
  if (!rate || Number(rate) <= 0) { res.status(400).json({ error: 'rate must be > 0' }); return; }

  const dir = direction === 'sell_usd' ? 'sell_usd' : 'buy_usd';
  const journal = loadJournal();

  let deposit: CashDeposit;
  if (dir === 'sell_usd') {
    // USD → NIS: withdraw USD, receive NIS
    if (!usdAmount || Number(usdAmount) <= 0) { res.status(400).json({ error: 'usdAmount must be > 0' }); return; }
    const usd = Number(usdAmount);
    deposit = {
      id: uuidv4(),
      portfolioId,
      dateTime: dateTime ?? new Date().toISOString(),
      direction: 'sell_usd',
      usdAmount: usd,
      nisAmount: usd * Number(rate),
      rate: Number(rate),
      usdReceived: 0,
    };
  } else {
    // NIS → USD: deposit NIS, receive USD
    if (!nisAmount || Number(nisAmount) <= 0) { res.status(400).json({ error: 'nisAmount must be > 0' }); return; }
    const nis = Number(nisAmount);
    deposit = {
      id: uuidv4(),
      portfolioId,
      dateTime: dateTime ?? new Date().toISOString(),
      direction: 'buy_usd',
      nisAmount: nis,
      rate: Number(rate),
      usdReceived: nis / Number(rate),
    };
  }
  journal.cashDeposits.push(deposit);
  saveJournal(journal);
  res.status(201).json(deposit);
});

router.delete('/deposits/:id', (req, res) => {
  const journal = loadJournal();
  const idx = journal.cashDeposits.findIndex(c => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'not found' }); return; }
  journal.cashDeposits.splice(idx, 1);
  saveJournal(journal);
  res.status(204).send();
});

// --- Tax Entries ---

router.get('/tax', (req, res) => {
  const { portfolioId } = req.query;
  const { taxEntries } = loadJournal();
  res.json(portfolioId ? taxEntries.filter(t => t.portfolioId === portfolioId) : taxEntries);
});

router.post('/tax', (req, res) => {
  const { portfolioId, usdAmount, note, dateTime } = req.body as Partial<TaxEntry>;
  if (!portfolioId) { res.status(400).json({ error: 'portfolioId required' }); return; }
  if (!usdAmount || Number(usdAmount) <= 0) { res.status(400).json({ error: 'usdAmount must be > 0' }); return; }

  const journal = loadJournal();
  const entry: TaxEntry = {
    id: uuidv4(),
    portfolioId,
    dateTime: dateTime ?? new Date().toISOString(),
    usdAmount: Number(usdAmount),
    note,
  };
  journal.taxEntries.push(entry);
  saveJournal(journal);
  res.status(201).json(entry);
});

router.delete('/tax/:id', (req, res) => {
  const journal = loadJournal();
  const idx = journal.taxEntries.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'not found' }); return; }
  journal.taxEntries.splice(idx, 1);
  saveJournal(journal);
  res.status(204).send();
});

export default router;
