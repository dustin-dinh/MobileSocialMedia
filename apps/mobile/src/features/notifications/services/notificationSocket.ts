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

/** Events whose payload is handed to subscribers as is (direct messages). */
const FORWARDED_EVENTS = ['message:new', 'message:read'] as const;
type ForwardedEvent = (typeof FORWARDED_EVENTS)[number];
type EventHandler = (payload: unknown) => void;
const eventHandlers = new Map<string, Set<EventHandler>>();
const reconnectListeners = new Set<Listener>();
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
    nextSocket.on('connect', () => reconnectListeners.forEach((listener) => listener()));

    FORWARDED_EVENTS.forEach((event) => {
      nextSocket.on(event, (payload: unknown) => {
        eventHandlers.get(event)?.forEach((handler) => handler(payload));
      });
    });

    socket = nextSocket;
  },

  disconnect(): void {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
  },

  /** Receive the payload of a forwarded event; returns the unsubscribe function. */
  on<T>(event: ForwardedEvent, handler: (payload: T) => void): () => void {
    const handlers = eventHandlers.get(event) ?? new Set<EventHandler>();

    handlers.add(handler as EventHandler);
    eventHandlers.set(event, handlers);

    return () => {
      handlers.delete(handler as EventHandler);
    };
  },

  /** Run `listener` after every (re)connect: whatever was missed must be reloaded. */
  onReconnect(listener: Listener): () => void {
    reconnectListeners.add(listener);

    return () => {
      reconnectListeners.delete(listener);
    };
  },

  /** Run `listener` whenever the notification list should be reloaded. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
} as const;
