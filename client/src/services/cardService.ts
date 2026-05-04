import { api } from './api';
import type { Card, CreateCardDto, UpdateCardDto } from '../types/card';

export interface PriceHistoryRow {
  value: number;
  timestamp: string;
}

export const cardService = {
  getAll: () => api.get<Card[]>('/api/cards'),
  getById: (id: string) => api.get<Card>(`/api/cards/${id}`),
  create: (dto: CreateCardDto) => api.post<Card>('/api/cards', dto),
  update: (id: string, dto: UpdateCardDto) => api.put<Card>(`/api/cards/${id}`, dto),
  remove: (id: string) => api.delete<void>(`/api/cards/${id}`),
  toggle: (id: string) => api.patch<Card>(`/api/cards/${id}/toggle`),
  fetch: (id: string) => api.post<Card>(`/api/cards/${id}/fetch`, {}),
  getHistory: (id: string, limit = 100) =>
    api.get<PriceHistoryRow[]>(`/api/cards/${id}/history?limit=${limit}`),
};
