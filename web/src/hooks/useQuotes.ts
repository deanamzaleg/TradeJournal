import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';

const POLL_MS = 30_000;

export function useQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Map<string, number>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const symbolsKey = symbols.join(',');

  const fetchAll = useCallback(async () => {
    if (symbols.length === 0) return;
    const results = await Promise.allSettled(symbols.map(s => api.quote.get(s)));
    setQuotes(prev => {
      const next = new Map(prev);
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') next.set(symbols[i], r.value.price);
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  useEffect(() => {
    if (symbols.length === 0) return;
    fetchAll();
    timerRef.current = setInterval(fetchAll, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  const refresh = useCallback(async () => {
    await api.quote.refresh().catch(() => {});
    await fetchAll();
  }, [fetchAll]);

  return { quotes, refresh };
}
