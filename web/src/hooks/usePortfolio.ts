import { useState, useEffect, useCallback } from 'react';
import type { Portfolio } from '../types';
import { api } from '../api/client';

export function usePortfolio() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await api.portfolios.list();
    setPortfolios(list);
    setActiveId(prev => {
      if (prev && list.find(p => p.id === prev)) return prev;
      return list[0]?.id ?? null;
    });
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (name: string, color?: string) => {
    const p = await api.portfolios.create(name, color);
    setPortfolios(prev => [...prev, p]);
    setActiveId(p.id);
    return p;
  }, []);

  const update = useCallback(async (id: string, patch: { name?: string; color?: string }) => {
    const p = await api.portfolios.update(id, patch);
    setPortfolios(prev => prev.map(x => x.id === id ? p : x));
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.portfolios.delete(id);
    setPortfolios(prev => {
      const next = prev.filter(p => p.id !== id);
      setActiveId(next[0]?.id ?? null);
      return next;
    });
  }, []);

  const active = portfolios.find(p => p.id === activeId) ?? null;

  return { portfolios, active, activeId, setActiveId, loading, create, update, remove, refresh };
}
