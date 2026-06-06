import dotenv from 'dotenv';
import path from 'path';
// dev:server runs with cwd=server/, so the repo-root .env is one level up.
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';
import portfoliosRouter from './routes/portfolios';
import transactionsRouter from './routes/transactions';
import cashRouter from './routes/cash';
import quotesRouter from './routes/quotes';
import settingsRouter from './routes/settings';
import { clearCache } from './finnhub';

const app = express();
const PORT = Number(process.env.PORT ?? 5174);

// Allow the frontend from localhost AND any private-LAN address on the dev port.
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl / same-origin / native apps
    const ok = /^http:\/\/(localhost|127\.0\.0\.1|(10|192\.168)\.[\d.]+|172\.(1[6-9]|2\d|3[01])\.[\d.]+)(:\d+)?$/.test(origin);
    cb(null, ok);
  },
}));
app.use(express.json());

app.use('/api/portfolios', portfoliosRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/cash', cashRouter);
app.use('/api/quote', quotesRouter);
app.use('/api/settings', settingsRouter);

// Clears the Finnhub price cache so next poll fetches fresh prices
app.post('/api/quote/refresh', (_req, res) => {
  clearCache();
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Trading Journal server running on http://localhost:${PORT}`);
});
