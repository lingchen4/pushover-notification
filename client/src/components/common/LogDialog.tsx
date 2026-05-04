import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Card } from '../../types/card';

interface EventLog {
  id: number;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  cardId?: string;
  cardType?: string;
  meta?: string;
}

interface LogDialogProps {
  open: boolean;
  onClose: () => void;
}

const LEVEL_STYLES: Record<string, string> = {
  error: 'bg-red-50 text-red-700 border-red-200',
  warn:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  info:  'bg-white text-gray-700 border-gray-100',
  debug: 'bg-gray-50 text-gray-400 border-gray-100',
};

const LEVEL_BADGE: Record<string, string> = {
  error: 'bg-red-100 text-red-600',
  warn:  'bg-yellow-100 text-yellow-600',
  info:  'bg-indigo-50 text-indigo-600',
  debug: 'bg-gray-100 text-gray-500',
};

export function LogDialog({ open, onClose }: LogDialogProps) {
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      api.get<EventLog[]>(`/api/events?limit=${limit}`),
      api.get<Card[]>('/api/cards'),
    ]).then(([evts, cds]) => {
      setLogs(evts);
      setCards(cds);
    }).finally(() => setLoading(false));
  }, [open, limit]);

  const cardMap = Object.fromEntries(cards.map((c) => [c.id, c.title]));

  if (!open) return null;

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString();
  }

  function parseMeta(meta?: string) {
    if (!meta) return null;
    try {
      return JSON.stringify(JSON.parse(meta), null, 2);
    } catch {
      return meta;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex flex-col w-full max-w-2xl max-h-[80vh] rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Event Log</h2>
          <div className="flex items-center gap-3">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:outline-none focus:border-indigo-400"
            >
              <option value={25}>Last 25</option>
              <option value={50}>Last 50</option>
              <option value={100}>Last 100</option>
              <option value={200}>Last 200</option>
            </select>
            <button
              onClick={onClose}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">Loading…</div>
          )}
          {!loading && logs.length === 0 && (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">No events yet</div>
          )}
          {!loading && logs.map((log) => {
            const meta = parseMeta(log.meta);
            const cardName = log.cardId ? (cardMap[log.cardId] ?? log.cardId.slice(0, 8) + '…') : null;
            return (
              <div key={log.id} className={`flex gap-3 px-5 py-3 border-b text-xs ${LEVEL_STYLES[log.level] ?? LEVEL_STYLES.info}`}>
                <div className="shrink-0 pt-0.5">
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LEVEL_BADGE[log.level] ?? LEVEL_BADGE.info}`}>
                    {log.level}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium text-gray-800">{log.event}</span>
                    {cardName && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 font-medium">{cardName}</span>
                    )}
                    {log.cardType && (
                      <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-400 font-medium">{log.cardType}</span>
                    )}
                    <span className="text-gray-400">{formatTime(log.timestamp)}</span>
                  </div>
                  {meta && (
                    <pre className="mt-1 text-[11px] text-gray-500 whitespace-pre-wrap break-all">{meta}</pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
