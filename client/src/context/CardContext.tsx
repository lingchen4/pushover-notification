import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { cardService } from '../services/cardService';
import toast from 'react-hot-toast';
import type { Card, CreateCardDto, UpdateCardDto } from '../types/card';

interface CardState {
  cards: Card[];
  loading: boolean;
}

type CardAction =
  | { type: 'SET_CARDS'; payload: Card[] }
  | { type: 'ADD_CARD'; payload: Card }
  | { type: 'UPDATE_CARD'; payload: Card }
  | { type: 'REMOVE_CARD'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

function cardReducer(state: CardState, action: CardAction): CardState {
  switch (action.type) {
    case 'SET_CARDS':
      return { ...state, cards: action.payload, loading: false };
    case 'ADD_CARD':
      return { ...state, cards: [action.payload, ...state.cards] };
    case 'UPDATE_CARD':
      return {
        ...state,
        cards: state.cards.map((c) => (c.id === action.payload.id ? action.payload : c)),
      };
    case 'REMOVE_CARD':
      return { ...state, cards: state.cards.filter((c) => c.id !== action.payload) };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
  }
}

interface CardContextValue extends CardState {
  addCard: (dto: CreateCardDto) => Promise<void>;
  updateCard: (id: string, dto: UpdateCardDto) => Promise<void>;
  refreshCard: (card: Card) => void;
  deleteCard: (id: string) => Promise<void>;
  toggleCard: (id: string) => Promise<void>;
}

const CardContext = createContext<CardContextValue | undefined>(undefined);

export function CardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cardReducer, { cards: [], loading: true });

  useEffect(() => {
    cardService
      .getAll()
      .then((cards) => dispatch({ type: 'SET_CARDS', payload: cards }))
      .catch(() => {
        toast.error('Failed to load cards');
        dispatch({ type: 'SET_LOADING', payload: false });
      });
  }, []);

  async function addCard(dto: CreateCardDto): Promise<void> {
    const card = await cardService.create(dto);
    dispatch({ type: 'ADD_CARD', payload: card });
  }

  async function updateCard(id: string, dto: UpdateCardDto): Promise<void> {
    const card = await cardService.update(id, dto);
    dispatch({ type: 'UPDATE_CARD', payload: card });
  }

  function refreshCard(card: Card): void {
    dispatch({ type: 'UPDATE_CARD', payload: card });
  }

  async function deleteCard(id: string): Promise<void> {
    await cardService.remove(id);
    dispatch({ type: 'REMOVE_CARD', payload: id });
  }

  async function toggleCard(id: string): Promise<void> {
    // Optimistic update
    const existing = state.cards.find((c) => c.id === id);
    if (existing) {
      dispatch({ type: 'UPDATE_CARD', payload: { ...existing, enabled: !existing.enabled } });
    }
    try {
      const card = await cardService.toggle(id);
      dispatch({ type: 'UPDATE_CARD', payload: card });
    } catch (err) {
      // Revert on failure
      if (existing) dispatch({ type: 'UPDATE_CARD', payload: existing });
      throw err;
    }
  }

  return (
    <CardContext.Provider value={{ ...state, addCard, updateCard, refreshCard, deleteCard, toggleCard }}>
      {children}
    </CardContext.Provider>
  );
}

export function useCards(): CardContextValue {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error('useCards must be used within CardProvider');
  return ctx;
}
