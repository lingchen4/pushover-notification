import { TimerIntervalSelector } from '../common/TimerIntervalSelector';
import { NotificationSettings } from '../common/NotificationSettings';
import { FormField } from '../common/FormField';
import { Input } from '../common/Input';
import type { AmazonPriceConfig } from '../../types/card';

interface AmazonPriceFieldsProps {
  config: AmazonPriceConfig;
  onChange: (config: AmazonPriceConfig) => void;
  currentPrice?: number;
}

export function AmazonPriceFields({ config, onChange, currentPrice }: AmazonPriceFieldsProps) {
  return (
    <>
      <FormField
        id="product-url"
        label="Product URL"
        type="url"
        value={config.productUrl}
        onChange={(e) => onChange({ ...config, productUrl: e.target.value })}
        placeholder="https://www.amazon.ca/dp/..."
      />

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Alert Target Price</span>
          {currentPrice != null && (
            <span className="text-xs text-gray-400">
              Current: <span className="font-medium text-gray-600">${currentPrice.toFixed(2)}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 shrink-0">$</span>
          <Input
            className="flex-1"
            type="number"
            step="0.01"
            min="0"
            value={config.targetPrice ?? ''}
            onChange={(e) => {
              const v = Number.parseFloat(e.target.value);
              onChange({ ...config, targetPrice: Number.isNaN(v) ? undefined : v });
            }}
            placeholder="e.g. 39.99"
          />
          {config.targetPrice != null && config.targetPrice > 0 && currentPrice != null && (
            <span className={`shrink-0 text-xs font-medium ${config.targetPrice <= currentPrice ? 'text-green-600' : 'text-orange-500'}`}>
              {config.targetPrice <= currentPrice
                ? `\u2212${(((currentPrice - config.targetPrice) / currentPrice) * 100).toFixed(0)}% off`
                : `+${(((config.targetPrice - currentPrice) / currentPrice) * 100).toFixed(0)}% above`}
            </span>
          )}
        </div>

        {currentPrice != null && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400">Quick set:</span>
            {[5, 10, 15, 20, 25].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => onChange({ ...config, targetPrice: Number.parseFloat((currentPrice * (1 - pct / 100)).toFixed(2)) })}
                className="rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-xs text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                &minus;{pct}%
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400">Notify when price drops to or below this amount</p>
      </div>

      <TimerIntervalSelector
        value={config.intervalMinutes}
        scheduledTime={config.scheduledTime}
        onChange={(m, t) => onChange({ ...config, intervalMinutes: m, scheduledTime: t })}
      />

      <NotificationSettings
        enabled={config.notificationsEnabled}
        config={config.pushoverConfig}
        onEnabledChange={(v) => onChange({ ...config, notificationsEnabled: v })}
        onConfigChange={(c) => onChange({ ...config, pushoverConfig: c })}
      />
    </>
  );
}
