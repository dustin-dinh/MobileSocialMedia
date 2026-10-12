/**
 * Unread-notification count shared by the Notifications screen and the tab
 * bar badge. The screen reports the count it computes; the realtime channel
 * triggers a refresh while the user is on another tab.
 */
import { useEffect, useState } from 'react';

import { USE_MOCK_API } from '../../config/runtime';
import { httpClient } from '../../services/httpClient';
import { notificationSocket } from './services/notificationSocket';

let count = 0;
const listeners = new Set<(value: number) => void>();

function set(value: number): void {
  count = Math.max(0, value);
  listeners.forEach((listener) => listener(count));
}

async function refresh(): Promise<void> {
  if (USE_MOCK_API) {
    return;
  }

  try {
    const response = await httpClient.requestJson<{ meta: { unreadCount: number } }>({
      method: 'GET',
      path: 'notifications?page=1&limit=1',
    });

    set(response.meta.unreadCount);
  } catch {
    // The badge is best-effort: keep the last known value.
  }
}

export const unreadStore = { refresh, set };

/** Current unread count; refreshes on mount and whenever a notification arrives. */
export function useUnreadNotifications(): number {
  const [value, setValue] = useState(count);

  useEffect(() => {
    listeners.add(setValue);
    setValue(count);
    void refresh();

    const unsubscribe = notificationSocket.subscribe(() => void refresh());

    return () => {
      listeners.delete(setValue);
      unsubscribe();
    };
  }, []);

  return value;
}
