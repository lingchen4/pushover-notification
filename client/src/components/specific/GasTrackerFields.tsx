import { TimerIntervalSelector } from '../common/TimerIntervalSelector';
import { NotificationSettings } from '../common/NotificationSettings';
import { FormField } from '../common/FormField';
import type { GasTrackerConfig } from '../../types/card';

interface GasTrackerFieldsProps {
  config: GasTrackerConfig;
  onChange: (config: GasTrackerConfig) => void;
}

export function GasTrackerFields({ config, onChange }: GasTrackerFieldsProps) {
  return (
    <>
      <FormField
        id="price-threshold"
        label={<>Price Threshold (¢/L) <span className="text-gray-400 font-normal">— optional</span></>}
        type="number"
        value={config.priceThreshold ?? ''}
        onChange={(e) => {
          const v = Number.parseFloat(e.target.value);
          onChange({ ...config, priceThreshold: Number.isNaN(v) ? undefined : v });
        }}
        placeholder="e.g. 160 — leave blank to always alert"
        helper="Only notify when price is at or below this value. Leave blank to notify on every check."
      />

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
