import { useState } from 'react';
import { Card } from '../common/Card';
import { CardEditModal } from '../common/CardEditModal';
import { ExternalLinkAnchor } from '../common/ExternalLinkAnchor';
import { AmazonPriceFields } from './AmazonPriceFields';
import { useTestNotification } from '../../hooks/useTestNotification';
import { useCardActions } from '../../hooks/useCardActions';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PriceHistoryDialog } from '../common/PriceHistoryDialog';
import { useCards } from '../../hooks/useCards';
import { formatDate, formatDollar, formatInterval } from '../../utils/helpers';
import type { Card as CardType, AmazonPriceConfig, AmazonPriceLatestData } from '../../types/card';

interface AmazonPriceCardProps {
  card: CardType;
}

export function AmazonPriceCard({ card }: AmazonPriceCardProps) {
  const { toggleNotifications } = useCards();
  const config = card.config as AmazonPriceConfig;
  const data = card.latestData as AmazonPriceLatestData | undefined;

  const { toggling, refreshing, handleToggle, handleRefresh, handleSave, handleDelete } = useCardActions(card);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState<AmazonPriceConfig>(config);
  const [formTitle, setFormTitle] = useState(card.title);

  const { sendTest, testing: testingNotif } = useTestNotification(card.id, form.pushoverConfig);

  const domain = (() => {
    try { return new URL(config.productUrl).hostname; } catch { return config.productUrl; }
  })();

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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <ExternalLinkAnchor href={config.productUrl} className="min-w-0" title={config.productUrl}>
              {domain}
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
          {data?.title && (
            <p className="text-xs text-gray-600 truncate" title={data.title}>{data.title}</p>
          )}
          <div className="flex items-end gap-3">
            <p className="text-2xl font-bold text-gray-900">{formatDollar(data?.price)}</p>
            {config.targetPrice != null && config.targetPrice > 0 && data?.price != null && (
              <p className={`text-xs font-medium mb-0.5 ${
                data.price <= config.targetPrice ? 'text-green-600' : 'text-orange-500'
              }`}>
                {data.price <= config.targetPrice
                  ? `✓ $${(config.targetPrice - data.price).toFixed(2)} below target`
                  : `↑ $${(data.price - config.targetPrice).toFixed(2)} above target`}
              </p>
            )}
          </div>
          <div className="space-y-0.5">
            {config.targetPrice != null && config.targetPrice > 0 && (
              <p className="text-xs text-gray-400">Target: ${config.targetPrice.toFixed(2)}</p>
            )}
            <p className="text-xs text-gray-400">{formatInterval(config.intervalMinutes, config.scheduledTime)}</p>
            {data?.lastChangedAt && (
              <p className="text-xs text-gray-400">Price changed {formatDate(data.lastChangedAt)}</p>
            )}
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
        <AmazonPriceFields config={form} onChange={setForm} currentPrice={data?.price} />
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
