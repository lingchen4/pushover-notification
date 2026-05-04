import { useContext } from 'react';
import { CardContext } from '../context/CardContext';
import type { CardContextValue } from '../context/CardContext';

export function useCards(): CardContextValue {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error('useCards must be used within CardProvider');
  return ctx;
}