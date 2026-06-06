# TradeJournal

A clean, modern trading journal for swing traders. Log trades, track P&L, analyze performance — all running locally with live Finnhub prices.

![Dashboard](screenshots/dashboard.png)

---

## Features

### Dashboard
- **Realized KPIs** — Net P/L, Win Rate, Profit Factor, Avg Win/Loss, Expectancy, Max Drawdown, W/L Streaks
- **Unrealized KPIs** — live market value and open P&L via Finnhub
- **Monthly Goal ring** — set a profit target, watch it fill
- **Top Trades** — best and worst closed trades ($ or %)
- **Top Unrealized** — best and worst open positions by live price

![KPIs and Goal](screenshots/kpis.png)

### Charts
- Cumulative realized P&L over time
- Win/Loss by strategy (bar chart)
- Monthly P&L summary

### Calendar View
Full monthly calendar grid (week starts Sunday) with:
- Green days = net profit, Red days = net loss, Blue days = buys only
- Weekly P&L column on the right

![Calendar](screenshots/calendar.png)

### Trades View
- **Open Trades tab** — all BUY fills for currently open positions, with live current price, unrealized P&L % and $, and a SELL button per row
- **Closed Trades tab** — all completed sells with realized P&L per sell event
- Sortable columns, asset/strategy/tag filters
- Finnhub API key input + manual Refresh Prices button

![Open Trades](screenshots/open-trades.png)
![Closed Trades](screenshots/closed-trades.png)

### Trade Entry Form
- BUY / SELL toggle
- Dollar-amount or shares quantity mode (default $200)
- Strategy dropdown built from past trades + Add New
- Tags as pill toggles + Add New
- Stop loss: None / Fixed / Trailing %
- **Sell All** button — auto-fills exact share count so no rounding residue
- SELL form pre-fills strategy, tags, notes from the matching BUY

![Trade Form](screenshots/trade-form.png)

### Cash & FX Panel
- Free USD cash balance (deposits − buys + sells − fees − tax)
- NIS → USD deposit form with rate input
- Weighted average buy rate displayed prominently
- Manual tax deduction
- Monthly fee total

![Cash Panel](screenshots/cash.png)

### Multiple Portfolios
Create and switch between named portfolios — same layout, separate data.

---

## Tech Stack

**Frontend** — React 18 · TypeScript · Vite · Tailwind CSS · Recharts · lucide-react  
**Backend** — Node · Express · TypeScript  
**Persistence** — `journal.json` (source of truth) + auto-mirrored `journal.csv`  
**Prices** — Finnhub API (proxied through backend, key never exposed to browser)

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/deanamzaleg/TradeJournal.git
cd TradeJournal
npm install
```

### 2. Get a Finnhub API key

1. Go to [finnhub.io](https://finnhub.io) and sign up (free)
2. After login, go to **Dashboard → API Keys**
3. Copy your key (looks like `d8hbet1r...`)

You can enter the key in two ways — pick one:

**Option A — via the app UI (easiest):**
Start the app, go to **Trades** tab, find the Finnhub bar at the top, paste your key and click **Save**. The key is stored on the backend in `server/data/settings.json` (never sent back to the browser).

**Option B — via `.env` file:**
Create a file called `.env` in the repo root:
```
FINNHUB_API_KEY=your_key_here
PORT=5174
DATA_DIR=./data
```

### 3. Run

```bash
npm run dev
```

Opens:
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5174](http://localhost:5174)

---

## How it works

### Position engine
Trades are stored as individual fills (not entry/exit pairs), enabling scale-in and scale-out. Replaying all fills in time order gives a running average cost per symbol. A position is **open** when shares > 0, **closed** when it returns to zero. Realized P&L on a sell = `(sellPrice − avgCost) × shares − fee`.

### Period filter
The period selector (Today / Week / Month / All Time) filters **realized KPIs** by the sell date — not by the buy date. This ensures average cost is always computed from all fills, even when the buy happened before the selected period.

### Dollar-mode quantity
When entering a trade in $ mode, the system converts: `shares = amount / price`. If you buy $200 and later sell $200 at a different price, rounding leaves a sub-cent residue. The app automatically zeroes positions worth less than $0.05 to avoid phantom open trades.

### Data files
All trade data is stored locally:
- `server/data/journal.json` — source of truth, human-readable
- `server/data/journal.csv` — auto-mirrored on every save (open in Excel)
- `server/data/settings.json` — stores the Finnhub key if entered via UI

None of these are committed to git.

---

## Available commands

```bash
npm run dev          # start backend + frontend together
npm run dev:server   # backend only
npm run dev:web      # frontend only
npm run build        # type-check + production build
npm run lint         # ESLint
```

---

## Screenshots

> Add screenshots to a `screenshots/` folder in the repo root after cloning.

| View | Description |
|------|-------------|
| `dashboard.png` | Main dashboard with KPIs, goal ring, charts |
| `kpis.png` | Realized and unrealized KPI cards |
| `calendar.png` | Monthly calendar with daily P&L coloring |
| `open-trades.png` | Open positions with live prices |
| `closed-trades.png` | Closed trades with realized P&L |
| `trade-form.png` | BUY/SELL entry form |
| `cash.png` | Cash & FX panel |

---

## Design

Dark trader UI with lime-green accent (`#b4ec51`). Tabular numerals throughout. Responsive layout.

- Background: `#0a0c0f`
- Panels: `#14171c`
- Accent: `#b4ec51`
- Positive: `#3fd07f` · Negative: `#f0566e` · Buy: `#3b82f6`
