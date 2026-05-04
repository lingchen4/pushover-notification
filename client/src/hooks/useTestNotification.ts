import { useState } from 'react';
import type { PushoverConfig } from '../types/card';
import { notificationService } from '../services/notificationService';
import toast from 'react-hot-toast';

export function useTestNotification(cardId: string, config: PushoverConfig) {
  const [testing, setTesting] = useState(false);

  async function sendTest() {
    setTesting(true);
    try {
      await notificationService.testCard(cardId, config.userKey, config.apiToken);
      toast.success('Test notification sent');
    } catch {
      toast.error('Failed to send test notification');
    } finally {
      setTesting(false);
    }
  }

  return { sendTest, testing };
}
