import type { ReactNode } from 'react';
import { Toggle } from '../common/Toggle';
import { Button } from '../common/Button';

interface CardShellProps {
  title: string;
  enabled: boolean;
  notificationsEnabled?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  toggling?: boolean;
  children: ReactNode;
}

export function Card({
  title,
  enabled,
  notificationsEnabled,
  onToggle,
  onEdit,
  onDelete,
  toggling = false,
  children,
}: CardShellProps) {
  return (
    <article className="relative flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        onClick={onDelete}
        aria-label="Delete card"
        className="absolute top-2 right-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 pr-8">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="truncate text-base font-semibold text-gray-900">{title}</h2>
          {notificationsEnabled !== undefined && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-label={notificationsEnabled ? 'Notifications on' : 'Notifications off'}
              className={`shrink-0 h-4 w-4 ${notificationsEnabled ? 'text-indigo-500' : 'text-gray-300'}`}
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              {!notificationsEnabled && <line x1="1" y1="1" x2="23" y2="23" />}
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1 px-5 py-4 text-sm text-gray-700">{children}</div>
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-3">
        <Button variant="ghost" onClick={onEdit} aria-label="Edit card">
          Edit
        </Button>
        <Toggle enabled={enabled} onChange={onToggle} disabled={toggling} label={`Toggle ${title}`} />
      </div>
    </article>
  );
}
