import { TimerIntervalSelector } from '../common/TimerIntervalSelector';
import { NotificationSettings } from '../common/NotificationSettings';
import type { GasTrackerConfig } from '../../types/card';

interface GasTrackerFieldsProps {
  config: GasTrackerConfig;
  onChange: (config: GasTrackerConfig) => void;
}

export function GasTrackerFields({ config, onChange }: GasTrackerFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price Threshold (¢/L) <span className="text-gray-400 font-normal">— optional</span>
        </label>
        <input
          type="number"
          value={config.priceThreshold ?? ''}
          onChange={(e) => {
            const v = Number.parseFloat(e.target.value);
            onChange({ ...config, priceThreshold: Number.isNaN(v) ? undefined : v });
          }}
          placeholder="e.g. 160 — leave blank to always alert"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-400">
          Only notify when price is at or below this value. Leave blank to notify on every check.
        </p>
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
