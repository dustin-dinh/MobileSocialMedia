/**
 * Number of conversations with unread messages, shared by the tab bar badge
 * and the inbox. Refreshed when a message arrives, when one is read and after
 * every reconnect.
 */
import { useEffect, useState } from 'react';

import { notificationSocket } from '../notifications/services/notificationSocket';
import { messageService } from './services/messageService';

let count = 0;
const listeners = new Set<(value: number) => void>();

async function refresh(): Promise<void> {
  try {
    count = await messageService.getUnreadCount();
    listeners.forEach((listener) => listener(count));
  } catch {
    // The badge is best-effort: keep the last known value.
  }
}

export const unreadMessages = { refresh };

export function useUnreadMessages(): number {
  const [value, setValue] = useState(count);

  useEffect(() => {
    listeners.add(setValue);
    setValue(count);
    void refresh();

    const unsubscribers = [
      notificationSocket.on('message:new', () => void refresh()),
      notificationSocket.onReconnect(() => void refresh()),
    ];

    return () => {
      listeners.delete(setValue);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  return value;
}
