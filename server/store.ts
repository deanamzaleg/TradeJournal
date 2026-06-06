import fs from 'fs';
import path from 'path';
import { Journal, Transaction, CashDeposit, TaxEntry, Portfolio } from './types';

const DATA_DIR = process.env.DATA_DIR ?? './data';
const JSON_PATH = path.join(DATA_DIR, 'journal.json');
const CSV_PATH = path.join(DATA_DIR, 'journal.csv');

const EMPTY: Journal = {
  portfolios: [],
  transactions: [],
  cashDeposits: [],
  taxEntries: [],
};

export function loadJournal(): Journal {
  if (!fs.existsSync(JSON_PATH)) return structuredClone(EMPTY);
  try {
    return JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8')) as Journal;
  } catch {
    return structuredClone(EMPTY);
  }
}

export function saveJournal(journal: Journal): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify(journal, null, 2), 'utf-8');
  writeCsv(journal);
}

function writeCsv(journal: Journal): void {
  const rows: string[] = [
    'type,id,portfolioId,dateTime,symbol,assetClass,side,price,quantity,quantityMode,fee,stopType,stopPrice,stopTrailingPct,strategy,tags,notes,nisAmount,rate,usdReceived,usdAmount,taxNote',
  ];

  for (const t of journal.transactions) {
    rows.push([
      'transaction', t.id, t.portfolioId, t.dateTime, csvEsc(t.symbol), t.assetClass,
      t.side, t.price, t.quantity, t.quantityMode, t.fee,
      t.stop.type, t.stop.price ?? '', t.stop.trailingPercent ?? '',
      csvEsc(t.strategy), csvEsc(t.tags.join('|')), csvEsc(t.notes),
      '', '', '', '', '',
    ].join(','));
  }

  for (const c of journal.cashDeposits) {
    rows.push([
      'cash', c.id, c.portfolioId, c.dateTime, '', '', '', '', '', '', '',
      '', '', '', '', '', '',
      c.nisAmount, c.rate, c.usdReceived, '', '',
    ].join(','));
  }

  for (const x of journal.taxEntries) {
    rows.push([
      'tax', x.id, x.portfolioId, x.dateTime, '', '', '', '', '', '', '',
      '', '', '', '', '', '',
      '', '', '', x.usdAmount, csvEsc(x.note ?? ''),
    ].join(','));
  }

  fs.writeFileSync(CSV_PATH, rows.join('\n'), 'utf-8');
}

function csvEsc(s: string): string {
  // Neutralize CSV/formula injection: a leading = + - @ (or tab/CR) is treated
  // as a formula by Excel/Sheets. Prefix with a single quote to defuse.
  let v = s;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  if (v.includes(',') || v.includes('"') || v.includes('\n') || v !== s) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
