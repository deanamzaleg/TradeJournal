import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { loadJournal, saveJournal } from '../store';
import { Portfolio } from '../types';

const router = Router();

router.get('/', (_req, res) => {
  const { portfolios } = loadJournal();
  res.json(portfolios);
});

router.post('/', (req, res) => {
  const { name, color } = req.body as { name?: string; color?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return; }
  const journal = loadJournal();
  const p: Portfolio = { id: uuidv4(), name: name.trim(), baseCurrency: 'USD', color: color || '#2edc85' };
  journal.portfolios.push(p);
  saveJournal(journal);
  res.status(201).json(p);
});

router.put('/:id', (req, res) => {
  const journal = loadJournal();
  const idx = journal.portfolios.findIndex(p => p.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'not found' }); return; }
  const { name, color } = req.body as { name?: string; color?: string };
  if (name !== undefined) {
    if (!name.trim()) { res.status(400).json({ error: 'name required' }); return; }
    journal.portfolios[idx].name = name.trim();
  }
  if (color !== undefined) journal.portfolios[idx].color = color;
  saveJournal(journal);
  res.json(journal.portfolios[idx]);
});

router.delete('/:id', (req, res) => {
  const journal = loadJournal();
  const idx = journal.portfolios.findIndex(p => p.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'not found' }); return; }
  journal.portfolios.splice(idx, 1);
  saveJournal(journal);
  res.status(204).send();
});

export default router;
