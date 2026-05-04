import { useState } from 'react';
import { Card } from '../common/Card';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { GasTrackerFields } from './GasTrackerFields';
import { useTestNotification } from '../../hooks/useTestNotification';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PriceHistoryDialog } from '../common/PriceHistoryDialog';
import { useCards } from '../../context/CardContext';
import { formatPrice, formatDate, formatInterval } from '../../utils/helpers';
import { cardService } from '../../services/cardService';
import type { Card as CardType, GasTrackerConfig, GasPriceLatestData } from '../../types/card';
import toast from 'react-hot-toast';

interface GasTrackerCardProps {
  card: CardType;
}

export function GasTrackerCard({ card }: GasTrackerCardProps) {
  const { toggleCard, updateCard, deleteCard, refreshCard } = useCards();
  const config = card.config as GasTrackerConfig;
  const data = card.latestData as GasPriceLatestData | undefined;

  const [toggling, setToggling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState<GasTrackerConfig>(config);
  const [formTitle, setFormTitle] = useState(card.title);

  const { sendTest, testing: testingNotif } = useTestNotification(card.id, form.pushoverConfig);

  async function handleToggle() {
    setToggling(true);
    try {
      await toggleCard(card.id);
    } catch {
      toast.error('Failed to toggle card');
    } finally {
      setToggling(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const updated = await cardService.fetch(card.id);
      refreshCard(updated);
      toast.success('Price refreshed');
    } catch {
      toast.error('Failed to fetch price');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSave() {
    try {
      await updateCard(card.id, { title: formTitle.trim() || card.title, config: form });
      setEditOpen(false);
      toast.success('Card updated');
    } catch {
      toast.error('Failed to update card');
    }
  }

  async function handleDelete() {
    try {
      await deleteCard(card.id);
      toast.success('Card deleted');
    } catch {
      toast.error('Failed to delete card');
    }
  }

  const changeLabel = data?.change
    ? (data.change > 0 ? `+${data.change}¢` : `${data.change}¢`)
    : null;

  const changeDateLabel = data?.latestDate
    ? data.latestDate.replace(/,?\s*\d{4}$/, '')  // strip year: "May 3, 2026" → "May 3"
    : null;

  const changeColor = data?.change
    ? (data.change > 0 ? 'text-red-500' : 'text-green-600')
    : '';

  return (
    <>
      <Card
        title={card.title}
        enabled={card.enabled}
        notificationsEnabled={config.notificationsEnabled}
        onToggle={handleToggle}
        onEdit={() => { setForm(config); setFormTitle(card.title); setEditOpen(true); }}
        onDelete={() => setDeleteOpen(true)}
        toggling={toggling}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <a
              href={data?.sourceUrl ?? 'https://toronto.citynews.ca/toronto-gta-gas-prices/'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-500 transition-colors group"
            >
              Toronto/GTA Average
              <svg className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryOpen(true)}
                className="text-gray-300 hover:text-indigo-500 transition-colors"
                title="Price history"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-50"
              >
                {refreshing ? 'Fetching…' : '↻ Refresh'}
              </button>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold text-gray-900">
              {data?.price !== undefined ? `${data.price}¢` : '—'}
            </p>
            {data?.price !== undefined && (
              <p className="text-sm text-gray-500 mb-1">per litre</p>
            )}
          </div>
          {changeLabel && (
            <p className={`text-sm font-medium ${changeColor}`}>
              {changeDateLabel && <span className="text-gray-500 font-normal">Change on {changeDateLabel}: </span>}
              {changeLabel}
            </p>
          )}
          <div className="space-y-0.5">
            <p className="text-xs text-gray-400">
              {config.priceThreshold != null ? `Alert ≤ ${formatPrice(config.priceThreshold)}` : 'Alert every check'}
            </p>
            <p className="text-xs text-gray-400">{formatInterval(config.intervalMinutes, config.scheduledTime)}</p>
            {data?.fetchedAt && (
              <p className="text-xs text-gray-400">Updated {formatDate(data.fetchedAt)}</p>
            )}
          </div>
        </div>
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit — ${card.title}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <GasTrackerFields config={form} onChange={setForm} />
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
            <Button variant="ghost" onClick={sendTest} disabled={testingNotif}>
              {testingNotif ? 'Sending…' : 'Test Notification'}
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button className="flex-1 sm:flex-none" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        message={`Delete "${card.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <PriceHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        cardId={card.id}
        cardTitle={card.title}
        cardType={card.type}
      />
    </>
  );
}
