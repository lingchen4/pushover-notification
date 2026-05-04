import { useState } from 'react';
import { cardService } from '../services/cardService';
import { useCards } from '../context/CardContext';
import type { Card } from '../types/card';
import toast from 'react-hot-toast';

interface UseCardActionsReturn {
  toggling: boolean;
  refreshing: boolean;
  handleToggle: () => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleSave: (formTitle: string, config: unknown, onSuccess: () => void) => Promise<void>;
  handleDelete: () => Promise<void>;
}

export function useCardActions(card: Card): UseCardActionsReturn {
  const { toggleCard, updateCard, deleteCard, refreshCard } = useCards();
  const [toggling, setToggling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleToggle() {
    setToggling(true);
    try {
      await toggleCard(card.id);
    } catch {
      toast.error('Failed to toggle card');
    } finally {
      setToggling(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const updated = await cardService.fetch(card.id);
      refreshCard(updated);
      toast.success('Price refreshed');
    } catch {
      toast.error('Failed to fetch price');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSave(formTitle: string, config: unknown, onSuccess: () => void) {
    try {
      await updateCard(card.id, { title: formTitle.trim() || card.title, config: config as Record<string, unknown> });
      onSuccess();
      toast.success('Card updated');
    } catch {
      toast.error('Failed to update card');
    }
  }

  async function handleDelete() {
    try {
      await deleteCard(card.id);
      toast.success('Card deleted');
    } catch {
      toast.error('Failed to delete card');
    }
  }

  return { toggling, refreshing, handleToggle, handleRefresh, handleSave, handleDelete };
}
