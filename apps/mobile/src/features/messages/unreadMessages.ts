/**
 * Number of conversations with unread messages, shared by the tab bar badge
 * and the inbox. Refreshed when a message arrives, when one is read and after
 * every reconnect.
 */
import { useEffect, useState } from 'react';

import { notificationSocket } from '../notifications/services/notificationSocket';
import { messageService, type UnreadCounts } from './services/messageService';

let counts: UnreadCounts = { count: 0, requests: 0 };
const listeners = new Set<(value: UnreadCounts) => void>();

async function refresh(): Promise<void> {
  try {
    counts = await messageService.getUnreadCounts();
    listeners.forEach((listener) => listener(counts));
  } catch {
    // The badge is best-effort: keep the last known value.
  }
}

export const unreadMessages = { refresh };

/** Unread conversations in the main inbox; message requests are counted apart. */
export function useUnreadMessages(): number {
  return useUnreadCounts().count;
}

export function useUnreadCounts(): UnreadCounts {
  const [value, setValue] = useState(counts);

  useEffect(() => {
    listeners.add(setValue);
    setValue(counts);
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
