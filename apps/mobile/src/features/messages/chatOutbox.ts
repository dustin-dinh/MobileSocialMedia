/**
 * Messages still on their way, or failed and waiting for a retry, kept outside
 * ChatScreen so leaving the chat and coming back keeps them (and a send that
 * finishes while the chat is closed still lands). Keyed by `user/conversation`
 * so another account signed in on the same phone never sees them.
 * shortcut: memory only, an app kill loses unsent messages; persist to storage if users ask for it.
 */
import type { Message, OutgoingMessage } from './services/messageService';

type Entry = { message: Message; outgoing: OutgoingMessage };
/** `sent`: the server's copy that replaces the local one. */
type Listener = (key: string, sent?: Message) => void;

const boxes = new Map<string, Entry[]>();
const listeners = new Set<Listener>();

function change(key: string, entries: Entry[], sent?: Message) {
  if (entries.length) {
    boxes.set(key, entries);
  } else {
    boxes.delete(key);
  }

  listeners.forEach((listener) => listener(key, sent));
}

export const chatOutbox = {
  key: (userId: string, conversationId: string) => `${userId}/${conversationId}`,

  /** Local copies, newest first. */
  messages: (key: string): Message[] => (boxes.get(key) ?? []).map((entry) => entry.message),

  outgoing: (key: string, id: string) => boxes.get(key)?.find((entry) => entry.message.id === id)?.outgoing,

  add(key: string, message: Message, outgoing: OutgoingMessage) {
    change(key, [{ message, outgoing }, ...(boxes.get(key) ?? [])]);
  },

  update(key: string, id: string, patch: Partial<Message>) {
    change(
      key,
      (boxes.get(key) ?? []).map((entry) =>
        entry.message.id === id ? { ...entry, message: { ...entry.message, ...patch } } : entry,
      ),
    );
  },

  remove(key: string, id: string, sent?: Message) {
    change(
      key,
      (boxes.get(key) ?? []).filter((entry) => entry.message.id !== id),
      sent,
    );
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};
