import { Router } from 'express';
import { getQuote } from '../finnhub';

const router = Router();

router.get('/', async (req, res) => {
  const symbol = (req.query.symbol as string)?.toUpperCase();
  if (!symbol) { res.status(400).json({ error: 'symbol required' }); return; }
  try {
    const price = await getQuote(symbol);
    res.json({ symbol, price });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'quote failed' });
  }
});

export default router;
