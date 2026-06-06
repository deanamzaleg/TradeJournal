import { Router } from 'express';
import { hasApiKey, setApiKey } from '../settings';

const router = Router();

// Returns whether a key is configured — never exposes the key itself
router.get('/', (_req, res) => {
  res.json({ hasApiKey: hasApiKey() });
});

router.post('/', (req, res) => {
  const { finnhubApiKey } = req.body as { finnhubApiKey?: string };
  if (!finnhubApiKey || typeof finnhubApiKey !== 'string' || !finnhubApiKey.trim()) {
    res.status(400).json({ error: 'finnhubApiKey required' });
    return;
  }
  setApiKey(finnhubApiKey.trim());
  res.json({ ok: true });
});

export default router;
