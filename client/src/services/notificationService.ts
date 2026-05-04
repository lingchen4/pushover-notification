import { api } from './api';
import type { EventLog } from '../types/event';

export const notificationService = {
  test: (userKey: string, apiToken: string, message: string, title?: string) =>
    api.post<{ success: boolean; request: string }>('/api/notifications/test', {
      userKey,
      apiToken,
      message,
      ...(title ? { title } : {}),
    }),
  testCard: (cardId: string, userKey?: string, apiToken?: string) =>
    api.post<{ success: boolean; request: string }>(`/api/cards/${cardId}/test-notification`, {
      ...(userKey ? { userKey } : {}),
      ...(apiToken ? { apiToken } : {}),
    }),
};

export const eventService = {
  getAll: (limit = 50, cardId?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cardId) params.set('cardId', cardId);
    return api.get<EventLog[]>(`/api/events?${params.toString()}`);
  },
};
