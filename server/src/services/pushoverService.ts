import axios from 'axios';
import { logEvent } from '../utils/eventLogger';
import type { PushoverSendOptions, PushoverResponse } from '../types/pushover';
import type { PushoverConfig } from '../types/card';

const PUSHOVER_API_URL = 'https://api.pushover.net/1/messages.json';

export function resolveCredentials(config: PushoverConfig): { userKey: string; apiToken: string } {
  return {
    userKey: config.userKey || process.env['PUSHOVER_USER_KEY'] || '',
    apiToken: config.apiToken || process.env['PUSHOVER_APP_TOKEN'] || '',
  };
}

export async function sendNotification(options: PushoverSendOptions): Promise<PushoverResponse> {
  const { userKey, apiToken, message, title, sound, priority } = options;

  logEvent({
    level: 'debug',
    event: 'pushover.sending',
    meta: { title, message: message.slice(0, 80) },
  });

  try {
    const { data } = await axios.post<PushoverResponse>(
      PUSHOVER_API_URL,
      {
        token: apiToken,
        user: userKey,
        message,
        title,
        sound,
        priority,
      },
      { timeout: 10_000 },
    );

    logEvent({ level: 'info', event: 'pushover.sent', meta: { title, status: data.status } });

    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logEvent({ level: 'error', event: 'pushover.failed', meta: { error: message } });
    throw err;
  }
}
