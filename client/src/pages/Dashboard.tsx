import { useState } from 'react';
import { useCards } from '../hooks/useCards';
import { Header } from '../components/layout/Header';
import { AddCardModal } from '../components/specific/AddCardModal';
import { GasTrackerCard } from '../components/specific/GasTrackerCard';
import { AmazonPriceCard } from '../components/specific/AmazonPriceCard';
import { LogDialog } from '../components/common/LogDialog';
import { CardType } from '../types/card';

export function Dashboard() {
  const { cards, loading } = useCards();
  const [addOpen, setAddOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAddCard={() => setAddOpen(true)} />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="min-w-0 h-48 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        )}

        {!loading && cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-5xl mb-4">🔔</p>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No cards yet</h2>
            <p className="text-sm text-gray-500 mb-6">
              Add your first card to start tracking gas prices or Amazon products.
            </p>
            <button
              onClick={() => setAddOpen(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              + Add Card
            </button>
          </div>
        )}

        {!loading && cards.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              if (card.type === CardType.GAS_TRACKER) {
                return <div key={card.id} className="min-w-0 flex"><GasTrackerCard card={card} /></div>;
              }
              if (card.type === CardType.AMAZON_PRICE) {
                return <div key={card.id} className="min-w-0 flex"><AmazonPriceCard card={card} /></div>;
              }
              return null;
            })}
          </div>
        )}
      </main>

      <AddCardModal open={addOpen} onClose={() => setAddOpen(false)} />
      <LogDialog open={logOpen} onClose={() => setLogOpen(false)} />

      {/* Floating log button */}
      <button
        onClick={() => setLogOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-white border border-gray-200 shadow-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:shadow-lg transition-all z-40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        Logs
      </button>
    </div>
  );
}
