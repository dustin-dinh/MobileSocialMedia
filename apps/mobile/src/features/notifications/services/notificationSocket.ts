/**
 * Realtime notification channel (Socket.IO).
 *
 * One shared connection per signed-in session: the auth session connects it
 * after login and disconnects it on logout. The socket only signals that
 * something new exists — REST (`GET /notifications`) stays the source of
 * truth, so listeners reload the list rather than trust the event payload.
 */
import { io, type Socket } from 'socket.io-client';

import { apiConfig } from '../../../config/api';

type Listener = () => void;

const NEW_NOTIFICATION_EVENT = 'notification:new';

const listeners = new Set<Listener>();
let socket: Socket | null = null;

function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.error('[notificationSocket] Listener error:', error);
    }
  }
}

/**
 * The socket namespace lives at the server root, not under the REST `/api`
 * prefix: `http://host:3000/api` -> `http://host:3000/notifications`.
 */
function getSocketUrl(): string | null {
  if (!apiConfig.baseUrl) {
    return null;
  }

  return `${apiConfig.baseUrl.replace(/\/api$/, '')}/notifications`;
}

export const notificationSocket = {
  connect(accessToken: string): void {
    const url = getSocketUrl();

    if (!url) {
      return;
    }

    notificationSocket.disconnect();

    const nextSocket = io(url, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    nextSocket.on(NEW_NOTIFICATION_EVENT, notifyListeners);
    // Events sent while offline are lost, so resync after every (re)connect.
    nextSocket.on('connect', notifyListeners);

    socket = nextSocket;
  },

  disconnect(): void {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
  },

  /** Run `listener` whenever the notification list should be reloaded. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
} as const;
