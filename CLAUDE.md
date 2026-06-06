# CLAUDE.md

Guidance for any AI coding assistant (and humans) working in this repository.
Read this file fully before writing or changing code.

---

## 1. Project Overview

**Trading Journal Dashboard** — a clean, modern, fully interactive app for logging
trades and analyzing personal trading performance, built for a single trader who
mostly holds positions **longer than one day** (swing trading), primarily **US
stocks** funded by converting **NIS → USD**.

It is a **locally-run app with a small backend**, because two core features can't
work in a browser-only page:
- **Live prices** come from **Finnhub** (proxied through the backend so the API
  key is never exposed to the browser).
- **Trade data auto-saves to disk** as both a JSON source-of-truth file and a
  continuously-updated **CSV mirror** (a browser alone cannot silently write files).

The app supports **multiple portfolios** (same layout, separate data), tracks a
**free USD cash balance**, the **average NIS→USD exchange rate**, manual **tax**
and **fee** deductions, and presents performance as KPIs, charts, buy/sell tables,
and a **monthly calendar grid**.

---

## 2. Tech Stack

**Frontend**
- React 18 + TypeScript (functional components + hooks only)
- Vite
- Tailwind CSS (dark theme)
- Recharts (all charts)
- lucide-react (icons)
- date-fns (dates; week starts **Sunday**)

**Backend**
- Node + Express + TypeScript
- Persists data to local disk (JSON + auto-mirrored CSV)
- Proxies Finnhub quote requests using a server-side API key

Keep dependencies lean. No UI component frameworks (no MUI/Ant/Bootstrap).

### Commands

```bash
# from repo root
npm install            # install all deps (root or workspaces)
npm run dev            # runs backend + frontend together (concurrently)
npm run dev:server     # backend only
npm run dev:web        # frontend only
npm run build          # type-check + build both
npm run lint
```

Always run `npm run build` (type-check) before declaring a task done.

### Environment / Secrets

Backend reads from `.env` (git-ignored). Required:

```
FINNHUB_API_KEY=<your finnhub key>      # NEVER hardcode or commit this
PORT=5174
DATA_DIR=./data                         # where journal.json + journal.csv live
```

- The Finnhub key lives **only** on the backend. The frontend calls our own
  `/api/quote` endpoint, never Finnhub directly.
- `.env`, `/data/*`, and any exported CSV must be in `.gitignore`.

---

## 3. Architecture & File Structure

```
.
├─ server/
│  ├─ index.ts            # express app + routes
│  ├─ finnhub.ts          # quote fetching + small in-memory cache
│  ├─ store.ts            # load/save journal.json; auto-write journal.csv on change
│  └─ routes/
│     ├─ portfolios.ts
│     ├─ transactions.ts  # buys/sells
│     ├─ cash.ts          # deposits, tax, fees
│     └─ quotes.ts        # GET /api/quote?symbol=AAPL
├─ web/
│  └─ src/
│     ├─ main.tsx
│     ├─ App.tsx                 # shell: sidebar + main + portfolio switcher
│     ├─ index.css
│     ├─ types.ts
│     ├─ api/client.ts           # typed fetch wrappers to the backend
│     ├─ lib/
│     │  ├─ metrics.ts           # ALL derived stats / KPI math
│     │  ├─ positions.ts         # average-cost position engine
│     │  └─ format.ts            # currency / percent / date formatters
│     ├─ hooks/
│     │  ├─ usePortfolio.ts      # active portfolio + switching
│     │  ├─ useJournal.ts        # transactions, cash, CRUD, filters
│     │  └─ useQuotes.ts         # polls /api/quote for open symbols
│     └─ components/
│        ├─ layout/      Sidebar, Topbar, PortfolioSwitcher, PeriodSelector
│        ├─ kpi/         RealizedKpis, UnrealizedKpis, KpiCard, GoalCard
│        ├─ form/        TradeEntryForm (BUY/SELL), CashForm, TaxForm
│        ├─ charts/      CumulativePnlChart, StrategyBarChart, DayOfWeekChart
│        ├─ calendar/    MonthlyCalendarGrid
│        ├─ tables/      BuysTable, SellsTable, TopTrades, TradeHistory
│        ├─ cash/        CashPanel, FxRatePanel
│        └─ ui/          Button, Modal, Field, Select, Badge, Dropdown
└─ data/                 journal.json (source of truth) + journal.csv (auto mirror)
```

**Rules**
- All money/PnL math lives in `lib/metrics.ts` and `lib/positions.ts`, never inline
  in components.
- Components are presentational; logic lives in `hooks/` and `lib/`.
- One component per file; strict TypeScript.

---

## 4. Data Model

The journal is a **transaction (fill) ledger**, not entry/exit pairs — because
trades can **scale in and out**, and positions use **average cost**. Define in
`web/src/types.ts` (shared shape mirrored on the server).

```ts
export type AssetClass = 'Stocks' | 'Crypto' | 'Options' | 'Futures';
export type Side = 'BUY' | 'SELL';
export type QuantityMode = 'shares' | 'dollars';   // default 'dollars'
export type StopType = 'none' | 'fixed' | 'trailing';

export interface Transaction {
  id: string;
  portfolioId: string;
  dateTime: string;          // ISO; form defaults to NOW
  symbol: string;            // auto-uppercase
  assetClass: AssetClass;    // default 'Stocks'
  side: Side;                // BUY adds to position; SELL closes against avg cost
  price: number;             // per-share execution price (USD)
  quantity: number;          // interpreted via quantityMode
  quantityMode: QuantityMode;// 'dollars' default → shares = quantity / price
  fee: number;               // USD, default 1.5 per transaction
  stop: { type: StopType; price?: number; trailingPercent?: number };
  strategy: string;          // free text
  tags: string[];            // free-form, may change later
  notes: string;             // psychology / free text
}

export interface CashDeposit {        // NIS → USD conversion that funds the account
  id: string; portfolioId: string; dateTime: string;
  nisAmount: number; rate: number;    // NIS per 1 USD
  usdReceived: number;                // = nisAmount / rate
}

export interface TaxEntry {           // manual, reduces USD cash
  id: string; portfolioId: string; dateTime: string;
  usdAmount: number; note?: string;
}

export interface Portfolio {
  id: string; name: string;           // user-named
  baseCurrency: 'USD';                 // figures in USD (NIS shown only for FX avg)
}
```

### SELL semantics (important)
**SELL = selling shares previously bought** (closing a long), **not shorting**.
Realized P/L on a sell uses the running **average cost** at that moment:
`realizedPnl = (sellPrice − avgCost) * sharesSold − fee`.

### Average-cost position engine (`lib/positions.ts`)
Replaying a portfolio's transactions in time order yields, per symbol:
- `shares`, `avgCost` (recomputed on each BUY), `realizedPnl` (accrued on SELLs).
- A position is **open** when `shares > 0`, **closed** when it returns to 0.
- Scaling in/out is just multiple BUY/SELL fills against the same symbol.

### Cash balance (`lib/metrics.ts`)
Free USD cash = `Σ deposits.usdReceived − Σ buys(price*shares) + Σ sells(price*shares) − Σ fees − Σ tax`.
Money returned from a SELL **stays as USD** in free cash and **does not** change
the average NIS→USD rate.

### Average NIS→USD rate
Weighted by deposits only: `Σ nisAmount / Σ usdReceived`. Selling never affects it.
Surface this prominently so the user "doesn't lose on the coin."

---

## 5. Backend Behavior

- **GET `/api/quote?symbol=AAPL`** → returns current price from Finnhub (with a
  short cache, e.g. 15–30s, to respect rate limits). Used for unrealized P/L.
- **Persistence:** `data/journal.json` is the source of truth. On **every**
  create/edit/delete the server rewrites it **and** regenerates `data/journal.csv`
  (one flat row per transaction, plus cash/tax rows or a separate CSV — keep it
  simple and documented). This is the "auto-save to CSV" requirement; no manual
  export click needed.
- All write routes validate input and return the updated entity.

---

## 6. Features (acceptance criteria)

### 6.1 KPI headlines — TWO groups
1. **Realized** (closed-out P/L, fees included): Net Realized P/L, Win Rate,
   Total (closed) Trades, Profit Factor, Avg Win vs Avg Loss.
2. **Unrealized** (open positions, using live Finnhub prices): Unrealized P/L,
   open position count, current market value.

KPIs compute over **closed** trades for realized stats. **Breakeven trades are
excluded** from win rate. Positive = green, negative = red; Net P/L is the most
prominent figure.

### 6.2 Goals (manual)
A goal card (progress ring, like the reference's gauge). User sets a target
manually (e.g. monthly profit target); the ring fills from realized P/L.

### 6.3 Trade Entry Form (BUY / SELL)
Two buttons **BUY** and **SELL** open a modal with `side` pre-set. Fields:
Date/Time (default now), Symbol (uppercase), Asset Class (default Stocks),
Price, Quantity with **shares/$** toggle (**default $, default value 200**),
**Fee (default 1.5)**, "Did you set a stop?" → Fixed (price) or Trailing (%),
Strategy (free text), Tags, Notes. On submit → POST to backend → UI updates
reactively (KPIs, positions, cash, calendar, tables). Transactions are
**editable and deletable**.

### 6.4 Cash & FX section
- **Free Cash panel:** shows current USD free cash. "Add cash" form asks for the
  **NIS amount and the NIS→USD rate**; it converts to USD, adds to free cash, and
  updates the **weighted average buy rate**.
- **FX Rate panel:** shows the running **average NIS→USD rate** and the latest
  deposit rate.
- **Tax:** a manual "Add tax" action that reduces USD free cash.
- Fees: show a line that **sums fees for the current month**.

### 6.5 Charts (Recharts)
- **Cumulative realized P/L** (line/area, account growth over time).
- **Win/Loss by Strategy** (bar, per setup).
- **Performance by Day of Week** (bar, Sun–Sat).

### 6.6 Monthly Calendar Grid (primary history view)
An **actual monthly calendar grid**, week starts **Sunday**, with a **7th/extra
column on the right: "Weekly realized P/L"** — one row per week:

```
| Sun | Mon | Tue | Wed | Thu | Fri | Sat | Weekly realized P/L |
```

Day-cell coloring (by that day's activity):
- Net **realized** P/L positive → **green**; negative → **red**.
- Day had **only buys, no sells** → **blue**.
- No activity → neutral.
Each populated cell shows the date and the day's realized P/L. The weekly column
sums realized P/L for that week. Month is navigable (prev/next).

### 6.7 Buy / Sell tables
- **Buys table:** every BUY fill, with running **average buy cost** per symbol.
- **Sells table (separate):** every SELL, with realized P/L for that sell.
A toggle/dropdown switches the "unit of a trade" between **each sell event** and
**each fully-closed position (round trip)** where that distinction applies.

### 6.8 Top trades
**Top Win** and **Top Loss** displays, with a **dropdown to switch between $ and %**.
Also include the sell-event / closed-position toggle from 6.7.

### 6.9 Filters & period
- Filter trade data by **Asset Class**, **Strategy**, and **Tags**.
- A **period selector** (Today / Week / Month / All-time) filtering KPIs + charts,
  echoing the reference's "Today" dropdown.

### 6.10 Portfolios
User can create **multiple named portfolios**. Switching the active portfolio
swaps **all data** (transactions, cash, FX, calendar) but keeps the **same layout**.

### 6.11 Extra analytics (starter set; user will add more later)
Include at least: **max drawdown**, **win/loss streaks**, **best & worst trade**,
**expectancy**. Keep `lib/metrics.ts` structured so new stats are easy to add.

---

## 7. Design System / Theme

Sleek **dark** trader UI with a **bright lime-green accent**; high contrast,
generous spacing, rounded cards. (The green gradient around the reference image is
just the mockup backdrop — the app background is dark.)

| Token            | Value     | Usage                                   |
|------------------|-----------|-----------------------------------------|
| `--bg`           | `#0a0c0f` | app background                          |
| `--panel`        | `#14171c` | cards / panels                         |
| `--panel-2`      | `#1b1f26` | inputs / nested surfaces               |
| `--border`       | `#262b33` | hairline borders                       |
| `--text`         | `#f2f4f7` | primary text                           |
| `--text-muted`   | `#8b929e` | labels / secondary                     |
| `--accent`       | `#b4ec51` | lime: primary buttons, active, positive|
| `--accent-hover` | `#a3e635` | accent hover                           |
| `--positive`     | `#3fd07f` | wins / profit                          |
| `--negative`     | `#f0566e` | losses                                 |
| `--buy`          | `#3b82f6` | buy-only calendar days (blue)          |

- Primary/positive controls use lime `--accent` with **dark text** on top.
- Tabular numerals everywhere for figures. Rounded cards (~12–16px), 8px grid.
- Fully responsive; columns stack on narrow viewports.

---

## 8. Conventions

- TypeScript strict; avoid `any` (comment if unavoidable).
- All currency/percent/date rendering via `lib/format.ts`.
- Money in USD; NIS appears only in the cash/FX section.
- Live prices only through the backend `/api/quote` proxy.
- Secrets only in backend `.env`; never log or expose `FINNHUB_API_KEY`.
- `data/`, `.env`, and CSV exports are git-ignored.

---

## 9. Out of Scope (for now)

- Shorting / short positions (SELL only closes existing longs).
- R-multiple tracking.
- P/L expressed in NIS (track average rate only for now).
- Multi-user accounts / cloud sync / hosting.
- Options/futures contract multipliers (treat as price × quantity for v1).

Revisit only when explicitly requested.
