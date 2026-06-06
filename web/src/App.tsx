import { useState, useMemo } from 'react';
import { usePortfolio } from './hooks/usePortfolio';
import { useJournal } from './hooks/useJournal';
import { useQuotes } from './hooks/useQuotes';
import { calcRealizedKpis, calcUnrealizedKpis, portfolioValueByDay, pnlByStrategy, pnlByMonth } from './lib/metrics';
import { buildPositions, openPositions } from './lib/positions';
import { Sidebar } from './components/layout/Sidebar';
import type { View } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { FilterBar } from './components/layout/FilterBar';
import { RealizedKpis } from './components/kpi/RealizedKpis';
import { UnrealizedKpis } from './components/kpi/UnrealizedKpis';
import { GoalCard } from './components/kpi/GoalCard';
import { TotalPortfolioChart } from './components/charts/TotalPortfolioChart';
import { StrategyBarChart } from './components/charts/StrategyBarChart';
import { MonthlyPnlChart } from './components/charts/MonthlyPnlChart';
import { MonthlyCalendarGrid } from './components/calendar/MonthlyCalendarGrid';
import { BuysTable } from './components/tables/BuysTable';
import { SellsTable } from './components/tables/SellsTable';
import { TopTrades } from './components/tables/TopTrades';
import { FinnhubPanel } from './components/trades/FinnhubPanel';
import { TopUnrealized } from './components/tables/TopUnrealized';
import { CashPanel } from './components/cash/CashPanel';
import { TradeEntryForm } from './components/form/TradeEntryForm';
import { CashForm } from './components/form/CashForm';
import { NewPortfolioModal, EditPortfolioModal } from './components/layout/PortfolioModals';
import { Button } from './components/ui/Button';
import { Input, Field } from './components/ui/Field';
import type { Transaction, Side } from './types';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const { portfolios, active, activeId, setActiveId, loading: pfLoading, create: createPortfolio, update: updatePortfolio, remove: removePortfolio } = usePortfolio();

  const {
    transactions, filteredTransactions, deposits, taxEntries,
    period, setPeriod,
    assetFilter, setAssetFilter,
    strategyFilter, setStrategyFilter,
    tagFilter, setTagFilter,
    allStrategies, allTags,
    addTransaction, updateTransaction, deleteTransaction,
    addDeposit, deleteDeposit,
    addTax, deleteTax,
    periodFilter,
  } = useJournal(activeId);

  // Live quotes for open positions
  const { positions } = useMemo(() => buildPositions(transactions), [transactions]);
  const openSymbols = useMemo(() => openPositions(positions).map(p => p.symbol), [positions]);
  const { quotes, refresh: refreshQuotes } = useQuotes(openSymbols);

  // Current-month realized P/L for the monthly goal ring (independent of selected period)
  const monthRealizedPnl = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return calcRealizedKpis(transactions, iso => new Date(iso) >= monthStart).netRealizedPnl;
  }, [transactions]);

  // KPIs
  const realizedKpis = useMemo(() => calcRealizedKpis(filteredTransactions, periodFilter), [filteredTransactions, periodFilter]);
  const unrealizedKpis = useMemo(() => calcUnrealizedKpis(transactions, quotes), [transactions, quotes]);
  const portByDay = useMemo(() => portfolioValueByDay(filteredTransactions), [filteredTransactions]);
  const strategyData = useMemo(() => pnlByStrategy(filteredTransactions), [filteredTransactions]);
  const monthData = useMemo(() => pnlByMonth(filteredTransactions), [filteredTransactions]);

  // Trade form state
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeSide, setTradeSide] = useState<Side>('BUY');
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [prefillSymbol, setPrefillSymbol] = useState('');

  // Cash form state
  const [cashModalOpen, setCashModalOpen] = useState(false);

  // Portfolio modals
  const [pfModalOpen, setPfModalOpen] = useState(false);
  const [pfEditOpen, setPfEditOpen] = useState(false);
  const [editingPf, setEditingPf] = useState<import('./types').Portfolio | null>(null);
  const [pfName, setPfName] = useState('');
  const [pfCreating, setPfCreating] = useState(false);

  // Table tab
  const [tableTab, setTableTab] = useState<'buys' | 'sells'>('sells');

  function openBuy() { setTradeSide('BUY'); setEditTx(null); setPrefillSymbol(''); setTradeModalOpen(true); }
  function openSell() { setTradeSide('SELL'); setEditTx(null); setPrefillSymbol(''); setTradeModalOpen(true); }
  function openSellFor(symbol: string) { setTradeSide('SELL'); setEditTx(null); setPrefillSymbol(symbol); setTradeModalOpen(true); }
  function openEdit(t: Transaction) { setEditTx(t); setTradeSide(t.side); setPrefillSymbol(''); setTradeModalOpen(true); }

  async function handleTradeSubmit(t: Omit<Transaction, 'id'>) {
    if (editTx) await updateTransaction(editTx.id, t);
    else await addTransaction(t);
  }

  function openEditPortfolio(pf: import('./types').Portfolio) { setEditingPf(pf); setPfEditOpen(true); }

  async function handleWelcomeCreate() {
    if (!pfName.trim()) return;
    setPfCreating(true);
    try {
      await createPortfolio(pfName.trim());
      setPfName('');
    } finally {
      setPfCreating(false);
    }
  }

  if (pfLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg text-muted text-sm">
        Loading…
      </div>
    );
  }

  if (!active && portfolios.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="bg-panel border border-border rounded-2xl p-8 flex flex-col gap-4 w-80">
          <h1 className="text-text font-semibold text-lg">Welcome to TradeJournal</h1>
          <p className="text-muted text-sm">Create your first portfolio to get started.</p>
          <Field label="Portfolio Name">
            <Input placeholder="e.g. Main Account" value={pfName} onChange={e => setPfName(e.target.value)} />
          </Field>
          <Button variant="primary" onClick={handleWelcomeCreate} disabled={pfCreating || !pfName.trim()}>
            {pfCreating ? 'Creating…' : 'Create Portfolio'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-bg">
      <Sidebar view={view} setView={setView} />

      <div className="flex flex-col flex-1 min-w-0 w-0">
        <Topbar
          portfolios={portfolios}
          activeId={activeId}
          setActiveId={setActiveId}
          onCreatePortfolio={() => setPfModalOpen(true)}
          onEditPortfolio={openEditPortfolio}
          period={period}
          setPeriod={setPeriod}
          onBuy={openBuy}
          onSell={openSell}
        />

        <main className="flex-1 overflow-y-auto py-8 px-12">
          <div className="max-w-[1320px] mx-auto w-full">
          {view === 'dashboard' && (
            <div className="flex flex-col gap-6">
              {/* KPI + Goal row */}
              <div className="flex gap-6">
                <div className="flex-1 min-w-0 flex flex-col gap-6">
                  <RealizedKpis kpis={realizedKpis} />
                  <UnrealizedKpis kpis={unrealizedKpis} />
                </div>
                <div className="w-72 flex-shrink-0 flex flex-col gap-4">
                  <GoalCard realizedPnl={monthRealizedPnl} />
                  <TopTrades transactions={filteredTransactions} />
                  <TopUnrealized transactions={transactions} quotes={quotes} />
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <TotalPortfolioChart data={portByDay} />
                </div>
                <StrategyBarChart data={strategyData} />
              </div>
              <MonthlyPnlChart data={monthData} />
            </div>
          )}

          {view === 'calendar' && (
            <div>
              <MonthlyCalendarGrid transactions={filteredTransactions} />
            </div>
          )}

          {view === 'trades' && (
            <div className="flex flex-col gap-4">
              <FinnhubPanel onRefresh={refreshQuotes} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  {(['sells', 'buys'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTableTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer capitalize ${tableTab === tab ? 'bg-accent text-bg font-semibold' : 'bg-panel border border-border text-muted hover:text-text hover:border-accent/40'}`}
                    >
                      {tab === 'sells' ? 'Sells / Closed Trades' : 'Buys / Open Trades'}
                    </button>
                  ))}
                </div>
                <FilterBar
                  assetFilter={assetFilter} setAssetFilter={setAssetFilter}
                  strategyFilter={strategyFilter} setStrategyFilter={setStrategyFilter}
                  tagFilter={tagFilter} setTagFilter={setTagFilter}
                  allStrategies={allStrategies} allTags={allTags}
                />
              </div>
              <div className="tj-card p-4">
                {tableTab === 'sells' ? (
                  <SellsTable transactions={filteredTransactions} onEdit={openEdit} onDelete={deleteTransaction} />
                ) : (
                  <BuysTable transactions={filteredTransactions} onEdit={openEdit} onDelete={deleteTransaction} onSell={openSellFor} quotes={quotes} />
                )}
              </div>
            </div>
          )}

          {view === 'cash' && activeId && (
            <div>
              <CashPanel
                transactions={transactions}
                deposits={deposits}
                taxEntries={taxEntries}
                onAddDeposit={() => setCashModalOpen(true)}
                onDeleteDeposit={deleteDeposit}
                onAddTax={async (amount, note) => { await addTax({ portfolioId: activeId, dateTime: new Date().toISOString(), usdAmount: amount, note }); }}
                onDeleteTax={deleteTax}
              />
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Trade entry modal */}
      {activeId && (
        <TradeEntryForm
          open={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
          defaultSide={tradeSide}
          defaultSymbol={prefillSymbol}
          portfolioId={activeId}
          onSubmit={handleTradeSubmit}
          editTx={editTx}
          transactions={transactions}
        />
      )}

      {/* Cash deposit modal */}
      {activeId && (
        <CashForm
          open={cashModalOpen}
          onClose={() => setCashModalOpen(false)}
          portfolioId={activeId}
          onSubmit={async (payload) => {
            await addDeposit({ portfolioId: activeId, dateTime: new Date().toISOString(), ...payload });
          }}
        />
      )}

      {/* New portfolio modal */}
      <NewPortfolioModal
        open={pfModalOpen}
        onClose={() => setPfModalOpen(false)}
        onCreate={async (name, color) => { await createPortfolio(name, color); }}
      />

      {/* Edit portfolio modal */}
      <EditPortfolioModal
        open={pfEditOpen}
        onClose={() => { setPfEditOpen(false); setEditingPf(null); }}
        portfolio={editingPf}
        onSave={async (id, name, color) => { await updatePortfolio(id, { name, color }); }}
        onDelete={async (id) => { await removePortfolio(id); }}
      />
    </div>
  );
}
