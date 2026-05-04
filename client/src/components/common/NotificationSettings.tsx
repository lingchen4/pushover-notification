import type { PushoverConfig } from '../../types/card';
import { Toggle } from './Toggle';
import { Input } from './Input';

interface NotificationSettingsProps {
  enabled: boolean;
  config: PushoverConfig;
  onEnabledChange: (enabled: boolean) => void;
  onConfigChange: (config: PushoverConfig) => void;
}

export function NotificationSettings({
  enabled,
  config,
  onEnabledChange,
  onConfigChange,
}: NotificationSettingsProps) {
  function update(partial: Partial<PushoverConfig>) {
    onConfigChange({ ...config, ...partial });
  }

  return (
    <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-semibold text-gray-800">Pushover Notifications</legend>
        <Toggle enabled={enabled} onChange={onEnabledChange} label="Enable notifications" />
      </div>
      {enabled && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">User Key <span className="text-gray-400 font-normal">— optional override</span></label>
            <Input
              type="text"
              value={config.userKey}
              onChange={(e) => update({ userKey: e.target.value })}
              placeholder="Leave blank to use global key"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API Token <span className="text-gray-400 font-normal">— optional override</span></label>
            <Input
              type="password"
              value={config.apiToken}
              onChange={(e) => update({ apiToken: e.target.value })}
              placeholder="Leave blank to use global token"
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
