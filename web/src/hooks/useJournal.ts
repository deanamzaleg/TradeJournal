import { useState, useEffect, useCallback } from 'react';
import type { Transaction, CashDeposit, TaxEntry } from '../types';
import { api, type CashDepositInput } from '../api/client';

export type PeriodKey = 'today' | 'week' | 'month' | 'all';

function periodFilter(period: PeriodKey): ((iso: string) => boolean) | undefined {
  if (period === 'all') return undefined;
  const now = new Date();
  const start = new Date();
  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const day = now.getDay(); // 0=Sun
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return (iso: string) => new Date(iso) >= start;
}

export function useJournal(portfolioId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deposits, setDeposits] = useState<CashDeposit[]>([]);
  const [taxEntries, setTaxEntries] = useState<TaxEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  const refresh = useCallback(async () => {
    if (!portfolioId) return;
    setLoading(true);
    const [txns, deps, taxes] = await Promise.all([
      api.transactions.list(portfolioId),
      api.cash.listDeposits(portfolioId),
      api.cash.listTax(portfolioId),
    ]);
    setTransactions(txns);
    setDeposits(deps);
    setTaxEntries(taxes);
    setLoading(false);
  }, [portfolioId]);

  useEffect(() => { refresh(); }, [refresh]);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    const created = await api.transactions.create(t);
    setTransactions(prev => [...prev, created]);
    return created;
  }, []);

  const updateTransaction = useCallback(async (id: string, t: Partial<Transaction>) => {
    const updated = await api.transactions.update(id, t);
    setTransactions(prev => prev.map(x => x.id === id ? updated : x));
    return updated;
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    await api.transactions.delete(id);
    setTransactions(prev => prev.filter(x => x.id !== id));
  }, []);

  const addDeposit = useCallback(async (d: CashDepositInput) => {
    const created = await api.cash.createDeposit(d);
    setDeposits(prev => [...prev, created]);
    return created;
  }, []);

  const deleteDeposit = useCallback(async (id: string) => {
    await api.cash.deleteDeposit(id);
    setDeposits(prev => prev.filter(x => x.id !== id));
  }, []);

  const addTax = useCallback(async (t: Omit<TaxEntry, 'id'>) => {
    const created = await api.cash.createTax(t);
    setTaxEntries(prev => [...prev, created]);
    return created;
  }, []);

  const deleteTax = useCallback(async (id: string) => {
    await api.cash.deleteTax(id);
    setTaxEntries(prev => prev.filter(x => x.id !== id));
  }, []);

  const filter = periodFilter(period);
  // Asset/strategy/tag filters only — period is passed separately to calcRealizedKpis
  // so that avg cost is built from all transactions, not just those in the period.
  const filteredTransactions = transactions.filter(t => {
    if (assetFilter !== 'all' && t.assetClass !== assetFilter) return false;
    if (strategyFilter !== 'all' && t.strategy !== strategyFilter) return false;
    if (tagFilter !== 'all' && !t.tags.includes(tagFilter)) return false;
    return true;
  });

  const allStrategies = [...new Set(transactions.map(t => t.strategy).filter(Boolean))];
  const allTags = [...new Set(transactions.flatMap(t => t.tags))];

  return {
    transactions,
    filteredTransactions,
    deposits,
    taxEntries,
    loading,
    refresh,
    period, setPeriod,
    assetFilter, setAssetFilter,
    strategyFilter, setStrategyFilter,
    tagFilter, setTagFilter,
    allStrategies,
    allTags,
    addTransaction, updateTransaction, deleteTransaction,
    addDeposit, deleteDeposit,
    addTax, deleteTax,
    periodFilter: filter,
  };
}
