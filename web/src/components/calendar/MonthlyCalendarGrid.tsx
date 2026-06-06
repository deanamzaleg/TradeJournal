import { useState, useMemo } from 'react';
import type { Transaction } from '../../types';
import { buildPositions } from '../../lib/positions';
import { fmtUsd } from '../../lib/format';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, addMonths, subMonths } from 'date-fns';

interface Props {
  transactions: Transaction[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayInfo {
  kind: 'sell' | 'buy' | 'none';
  buyTickers: string[];
  sellTickers: string[];
  pnl: number;
}

export function MonthlyCalendarGrid({ transactions }: Props) {
  const [month, setMonth] = useState(new Date());

  // Per-day map. Sells use globally-correct realized P/L (multi-day positions);
  // buy-only days are days with buys but no closing sells.
  const dayMap = useMemo(() => {
    const { closedTrades } = buildPositions(transactions);
    const map = new Map<string, DayInfo>();

    const get = (d: string): DayInfo =>
      map.get(d) ?? { kind: 'none', buyTickers: [], sellTickers: [], pnl: 0 };

    for (const ct of closedTrades) {
      const d = ct.sellDateTime.slice(0, 10);
      const info = get(d);
      info.pnl += ct.realizedPnl;
      if (!info.sellTickers.includes(ct.symbol)) info.sellTickers.push(ct.symbol);
      info.kind = 'sell';
      map.set(d, info);
    }

    for (const t of transactions) {
      if (t.side !== 'BUY') continue;
      const d = t.dateTime.slice(0, 10);
      const info = get(d);
      if (!info.buyTickers.includes(t.symbol)) info.buyTickers.push(t.symbol);
      if (info.kind !== 'sell') info.kind = 'buy';
      map.set(d, info);
    }

    return map;
  }, [transactions]);

  const weeks = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });

    const firstDow = getDay(start);
    const padStart = Array.from({ length: firstDow }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() - (firstDow - i));
      return d;
    });

    const allDays = [...padStart, ...days];
    const result: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      result.push(allDays.slice(i, i + 7));
    }
    return result;
  }, [month]);

  const isCurrentMonth = (d: Date) => d.getMonth() === month.getMonth();

  function cellStyle(info: DayInfo): string {
    if (info.kind === 'buy') return 'bg-buy/10 border-l-2 border-buy';
    if (info.kind === 'sell') {
      if (info.pnl > 0) return 'bg-positive/10 border-l-2 border-positive';
      if (info.pnl < 0) return 'bg-negative/10 border-l-2 border-negative';
      return 'bg-panel-2';
    }
    return 'bg-transparent';
  }

  return (
    <div className="tj-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text">{format(month, 'MMMM yyyy')}</h3>
        <div className="flex gap-1">
          <button onClick={() => setMonth(m => subMonths(m, 1))} aria-label="Previous month" className="p-1.5 rounded-md text-muted hover:text-text hover:bg-panel-2 transition-colors cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setMonth(new Date())} className="px-2 py-1 text-xs text-muted hover:text-text hover:bg-panel-2 rounded-md transition-colors cursor-pointer">
            Today
          </button>
          <button onClick={() => setMonth(m => addMonths(m, 1))} aria-label="Next month" className="p-1.5 rounded-md text-muted hover:text-text hover:bg-panel-2 transition-colors cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-8 gap-px mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-muted font-medium py-1">{d}</div>
        ))}
        <div className="text-center text-xs text-muted font-medium py-1">Week P/L</div>
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => {
        const weekPnl = week
          .filter(isCurrentMonth)
          .reduce((sum, d) => {
            const info = dayMap.get(format(d, 'yyyy-MM-dd'));
            return sum + (info && info.kind === 'sell' ? info.pnl : 0);
          }, 0);

        return (
          <div key={wi} className="grid grid-cols-8 gap-px mb-px">
            {week.map((day, di) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const inMonth = isCurrentMonth(day);
              const info = dayMap.get(dateStr) ?? { kind: 'none', buyTickers: [], sellTickers: [], pnl: 0 } as DayInfo;

              const isToday = inMonth && format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <div
                  key={di}
                  className={`min-h-[88px] rounded-md p-1.5 flex flex-col items-center text-center ${inMonth ? cellStyle(info) : 'opacity-20 bg-transparent'}`}
                >
                  <span
                    className={`text-xs font-medium flex items-center justify-center w-[22px] h-[22px] rounded-full shrink-0 ${isToday ? 'text-accent border border-accent bg-accent/10' : inMonth ? 'text-muted' : 'text-border'}`}
                  >
                    {format(day, 'd')}
                  </span>

                  {inMonth && info.kind === 'sell' && (
                    <div className="flex flex-col items-center justify-center flex-1 gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-negative">Sell</span>
                      <span className="text-[11px] font-semibold text-text leading-tight">
                        {info.sellTickers.slice(0, 3).join(', ')}{info.sellTickers.length > 3 ? ` +${info.sellTickers.length - 3}` : ''}
                      </span>
                      <span className={`text-[11px] tabular-nums font-semibold ${info.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {fmtUsd(info.pnl)}
                      </span>
                    </div>
                  )}

                  {inMonth && info.kind === 'buy' && (
                    <div className="flex flex-col items-center justify-center flex-1 gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-buy">Buy</span>
                      <span className="text-[11px] font-semibold text-text leading-tight">
                        {info.buyTickers.slice(0, 3).join(', ')}{info.buyTickers.length > 3 ? ` +${info.buyTickers.length - 3}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Weekly P/L */}
            <div
              className={`min-h-[88px] rounded-md p-1.5 flex flex-col justify-center items-center text-center gap-0.5 ${weekPnl > 0 ? 'text-positive bg-positive/5' : weekPnl < 0 ? 'text-negative bg-negative/5' : 'text-muted'}`}
            >
              <span className="text-[10px] text-muted font-medium">Week</span>
              <span className="text-xs tabular-nums font-semibold">
                {weekPnl !== 0 ? fmtUsd(weekPnl) : '—'}
              </span>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex gap-4 mt-4 pt-3 border-t border-border">
        {[
          { color: 'var(--color-positive)', label: 'Profit day' },
          { color: 'var(--color-negative)', label: 'Loss day' },
          { color: 'var(--color-buy)', label: 'Buy only' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm opacity-80" style={{ background: color }} />
            <span className="text-[11px] text-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
