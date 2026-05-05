import { useState } from 'react';
import { Card } from '../common/Card';
import { CardEditModal } from '../common/CardEditModal';
import { ExternalLinkAnchor } from '../common/ExternalLinkAnchor';
import { GasTrackerFields } from './GasTrackerFields';
import { useTestNotification } from '../../hooks/useTestNotification';
import { useCardActions } from '../../hooks/useCardActions';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PriceHistoryDialog } from '../common/PriceHistoryDialog';
import { useCards } from '../../hooks/useCards';
import { formatPrice, formatDate, formatInterval } from '../../utils/helpers';
import type { Card as CardType, GasTrackerConfig, GasPriceLatestData } from '../../types/card';

interface GasTrackerCardProps {
  card: CardType;
}

export function GasTrackerCard({ card }: GasTrackerCardProps) {
  const { toggleNotifications } = useCards();
  const config = card.config as GasTrackerConfig;
  const data = card.latestData as GasPriceLatestData | undefined;

  const { toggling, refreshing, handleToggle, handleRefresh, handleSave, handleDelete } = useCardActions(card);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState<GasTrackerConfig>(config);
  const [formTitle, setFormTitle] = useState(card.title);

  const { sendTest, testing: testingNotif } = useTestNotification(card.id, form.pushoverConfig);

  const changeLabel = data?.change
    ? (data.change > 0 ? `+${data.change}¢` : `${data.change}¢`)
    : null;

  const changeDateLabel = data?.latestDate
    ? data.latestDate.replace(/,?\s*\d{4}$/, '')  // strip year: "May 3, 2026" → "May 3"
    : null;

  const changeColor = data?.change
    ? (data.change > 0 ? 'text-red-500' : 'text-green-600')
    : '';

  const upcomingColor = data?.direction === '+' ? 'text-red-500' : data?.direction === '-' ? 'text-green-600' : 'text-gray-500';
  const upcomingIcon = data?.direction === '+' ? '↑' : data?.direction === '-' ? '↓' : '→';

  return (
    <div className="w-full">
      <Card
        title={card.title}
        enabled={card.enabled}
        notificationsEnabled={config.notificationsEnabled}
        onToggle={handleToggle}
        onNotificationsToggle={() => toggleNotifications(card.id)}
        onEdit={() => { setForm(config); setFormTitle(card.title); setEditOpen(true); }}
        onDelete={() => setDeleteOpen(true)}
        toggling={toggling}
      >
        <div className="space-y-3">
          {/* Source link + actions */}
          <div className="flex items-center justify-between">
            <ExternalLinkAnchor href={data?.sourceUrl ?? 'https://toronto.citynews.ca/toronto-gta-gas-prices/'}>
              Toronto/GTA Average
            </ExternalLinkAnchor>
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
          <p className="text-xs text-gray-600">Regular Unleaded</p>

          {/* Price */}
          <div className="flex items-end gap-3">
            <p className="text-2xl font-bold text-gray-900">
              {data?.price !== undefined ? `${data.price}¢` : '—'}
            </p>
          </div>

          {/* Last change */}
          {changeLabel && (
            <p className={`text-sm font-medium ${changeColor}`}>
              {changeDateLabel && <span className="text-gray-500 font-normal">on {changeDateLabel}: </span>}
              {changeLabel}
            </p>
          )}

          {/* Upcoming */}
          {data?.headlineChange && (
            <p className={`text-xs font-medium ${upcomingColor}`}>
              <span className="text-gray-500 font-normal">Upcoming move: </span>
              {upcomingIcon} {data.headlineChange}
            </p>
          )}

          {/* Footer meta */}
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

      <CardEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        cardTitle={card.title}
        formTitle={formTitle}
        onFormTitleChange={setFormTitle}
        onSave={() => handleSave(formTitle, form, () => setEditOpen(false))}
        onTestNotification={sendTest}
        testingNotif={testingNotif}
      >
        <GasTrackerFields config={form} onChange={setForm} />
      </CardEditModal>

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
    </div>
  );
}
