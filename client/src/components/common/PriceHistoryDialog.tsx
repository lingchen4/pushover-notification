import { useEffect, useState } from 'react';
import { cardService } from '../../services/cardService';
import type { PriceHistoryRow } from '../../services/cardService';
import { CardType } from '../../types/card';
import { Modal } from './Modal';

interface PriceHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  cardId: string;
  cardTitle: string;
  cardType: string;
}

function Sparkline({ rows, formatValue }: { readonly rows: PriceHistoryRow[]; readonly formatValue: (v: number) => string }) {
  if (rows.length < 2) return null;

  const reversed = [...rows].reverse();
  const values = reversed.map((r) => r.value);
  const timestamps = reversed.map((r) => r.timestamp);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 400;
  const H = 72;
  const padX = 2;
  const padY = 6;

  const pts = values.map((v, i) => ({
    x: padX + (i / (values.length - 1)) * (W - padX * 2),
    y: padY + ((max - v) / range) * (H - padY * 2),
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const lastPt = pts.at(-1);
  const areaPath = lastPt ? `${linePath} L${lastPt.x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z` : '';

  const fmtDate = (ts: string) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="bg-gray-50 rounded-lg px-3 pt-3 pb-2">
      <div className="flex items-stretch gap-3">
        {/* Y-axis */}
        <div className="flex flex-col justify-between shrink-0 text-right pb-5">
          <span className="text-[10px] text-gray-400 leading-none">{formatValue(max)}</span>
          <span className="text-[10px] text-gray-400 leading-none">{formatValue(min)}</span>
        </div>
        {/* Chart + x-axis */}
        <div className="flex flex-col flex-1 min-w-0">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16 sm:h-28" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            {/* Baseline */}
            <line x1={padX} y1={H - padY + 2} x2={W - padX} y2={H - padY + 2} stroke="rgb(229,231,235)" strokeWidth="1" />
            <path d={areaPath} fill="url(#sparkGrad)" />
            <path d={linePath} fill="none" stroke="rgb(99,102,241)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* X-axis */}
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">{fmtDate(timestamps[0])}</span>
            <span className="text-[10px] text-gray-400">{fmtDate(timestamps.at(-1) ?? '')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const LIMIT_OPTIONS = [25, 50, 100, 200];

function formatTs(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function PriceHistoryDialog({ open, onClose, cardId, cardTitle, cardType }: Readonly<PriceHistoryDialogProps>) {
  const [rows, setRows] = useState<PriceHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(50);

  const isGas = cardType === CardType.GAS_TRACKER;

  function formatValue(v: number) {
    return isGas ? `${v}¢` : `$${v.toFixed(2)}`;
  }

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    cardService.getHistory(cardId, limit)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [open, cardId, limit]);

  return (
    <Modal open={open} onClose={onClose} title={`${cardTitle} — Price history`}>
      {/* Limit selector */}
      <div className="flex justify-end mb-3">
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600"
        >
          {LIMIT_OPTIONS.map((n) => (
            <option key={n} value={n}>Last {n}</option>
          ))}
        </select>
      </div>

      {/* Chart */}
      {rows.length > 1 && (
        <div className="mb-4">
          <Sparkline rows={rows} formatValue={formatValue} />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
      ) : null}
      {!loading && rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No history yet.</p>
      ) : null}
      {!loading && rows.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium text-right">Price</th>
              <th className="pb-2 font-medium text-right">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const prev = rows[i + 1];
              const diff = prev === undefined ? null : row.value - prev.value;
              let diffEl: React.ReactNode = <span className="text-gray-300">—</span>;
              if (diff !== null && diff !== 0) {
                const sign = diff > 0 ? '+' : '';
                diffEl = (
                  <span className={diff > 0 ? 'text-red-500' : 'text-green-600'}>
                    {sign}{isGas ? `${diff.toFixed(1)}¢` : `$${diff.toFixed(2)}`}
                  </span>
                );
              } else if (diff === 0) {
                diffEl = <span className="text-gray-300">0</span>;
              }
              return (
                <tr key={row.timestamp} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-500 text-xs">{formatTs(row.timestamp)}</td>
                  <td className="py-2 text-right font-medium text-gray-800">{formatValue(row.value)}</td>
                  <td className="py-2 text-right text-xs">{diffEl}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </Modal>
  );
}
