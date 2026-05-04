import { useContext } from 'react';
import { CardContext } from '../context/cardContextDef';
import type { CardContextValue } from '../context/cardContextDef';

export function useCards(): CardContextValue {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error('useCards must be used within CardProvider');
  return ctx;
}