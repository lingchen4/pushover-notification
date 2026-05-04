import { Button } from '../common/Button';

interface HeaderProps {
  onAddCard: () => void;
}

export function Header({ onAddCard }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-indigo-600">🔔</span>
          <h1 className="text-lg font-bold text-gray-900">Pushover Dashboard</h1>
        </div>
        <Button onClick={onAddCard}>+ Add Card</Button>
      </div>
    </header>
  );
}
