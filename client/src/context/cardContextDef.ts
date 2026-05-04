import { createContext } from 'react';
import type { Card, CreateCardDto, UpdateCardDto } from '../types/card';

export interface CardState {
  cards: Card[];
  loading: boolean;
}

export interface CardContextValue extends CardState {
  addCard: (dto: CreateCardDto) => Promise<void>;
  updateCard: (id: string, dto: UpdateCardDto) => Promise<void>;
  refreshCard: (card: Card) => void;
  deleteCard: (id: string) => Promise<void>;
  toggleCard: (id: string) => Promise<void>;
  toggleNotifications: (id: string) => Promise<void>;
}

export const CardContext = createContext<CardContextValue | undefined>(undefined);
