import { useEffect, useState } from 'react';
import { cardService } from '../../services/cardService';
import type { PriceHistoryRow } from '../../services/cardService';
import { CardType } from '../../types/card';

interface PriceHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  cardId: string;
  cardTitle: string;
  cardType: string;
}

function Sparkline({ rows }: { readonly rows: PriceHistoryRow[] }) {
  if (rows.length < 2) return null;

  const values = [...rows].reverse().map((r) => r.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 400;
  const H = 80;
  const padX = 4;
  const padY = 4;
  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * (W - padX * 2);
    const y = padY + ((max - v) / range) * (H - padY * 2);
    return `${x},${y}`;
  });
  const polyline = points.join(' ');

  // Filled area path
  const first = points[0].split(',');
  const last = points.at(-1)?.split(',');
  const area = last
    ? `M${first[0]},${H} L${polyline.replaceAll(/(\d+\.?\d*),(\d+\.?\d*)/g, 'L$1,$2').slice(1)} L${last[0]},${H} Z`
    : '';

  return (
    <div className="flex items-stretch gap-2">
      {/* Y-axis labels */}
      <div className="flex flex-col justify-between text-right shrink-0 py-1">
        <span className="text-[11px] font-medium text-gray-500 leading-none">{max.toFixed(1)}</span>
        <span className="text-[11px] font-medium text-gray-500 leading-none">{min.toFixed(1)}</span>
      </div>
      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="flex-1 h-20" preserveAspectRatio="none">
        <path d={area} fill="rgba(99,102,241,0.1)" />
        <polyline points={polyline} fill="none" stroke="rgb(99,102,241)" strokeWidth="1.5" />
      </svg>
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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Dialog */}
      <dialog
        open
        aria-label={`${cardTitle} price history`}
        className="fixed z-50 inset-0 m-auto bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] p-0 border-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">{cardTitle}</h2>
            <p className="text-xs text-gray-400">Price history</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600"
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>Last {n}</option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chart */}
        {rows.length > 1 && (
          <div className="px-4 sm:px-5 pt-4 pb-2">
            <Sparkline rows={rows} />
          </div>
        )}

        {/* Table */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-5 pb-4">
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
        </div>
      </dialog>
    </>
  );
}
