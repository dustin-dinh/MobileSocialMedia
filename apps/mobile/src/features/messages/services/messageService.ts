/**
 * Direct messages — data-access layer. Mock mode keeps a small in-memory
 * inbox; live mode talks to `/conversations` (see docs/api-contract.md).
 *
 * Message requests: a stranger's conversation stays PENDING (text only, a
 * few messages, no "seen") until the recipient accepts or replies.
 * Anonymous conversations: the server replaces the hidden sender with
 * `ANONYMOUS_USER_ID` / "Người ẩn danh" everywhere, until they reveal themselves.
 */
import { USE_MOCK_API } from '../../../config/runtime';
import { httpClient } from '../../../services/httpClient';
import type { PostAuthor } from '../../feed/types';
import { toUploadPart } from '../../post/services/postService';

/** Stands in for the hidden sender of an anonymous conversation. */
export const ANONYMOUS_USER_ID = 'anonymous';

export type Message = {
  content: string | null;
  conversationId: string;
  createdAt: string;
  /** The image may be sensitive: blurred until the recipient chooses to see it. */
  sensitive?: boolean;
  /** Set when the message replies to a story. */
  storyId?: string | null;
  /** Wording often used in scams, from a stranger or an anonymous sender. */
  warning?: boolean;
  /** Local only: the send failed and can be retried. */
  failed?: boolean;
  id: string;
  imageUrl: string | null;
  /** Local only: shown at once, still on its way to the server. */
  pending?: boolean;
  senderId: string;
};

export type ConversationAnonymity = {
  /** SENDER: you are hidden. RECIPIENT: the other person is. */
  role: 'RECIPIENT' | 'SENDER';
  revealed: boolean;
};

export type Conversation = {
  anonymous: ConversationAnonymity | null;
  canSendImages: boolean;
  /** Closed by the recipient (report or block): nobody can send any more. */
  closed: boolean;
  id: string;
  /** A request waiting for your answer ("Tin nhắn chờ"). */
  isRequest: boolean;
  lastMessage: Message | null;
  lastMessageAt: string;
  peer: PostAuthor;
  status: 'ACCEPTED' | 'PENDING';
  unreadCount: number;
};

export type UnreadCounts = {
  /** Conversations with unread messages in the main inbox (tab badge). */
  count: number;
  /** Pending message requests. */
  requests: number;
};

export type MessagePage = {
  /** The conversation as the server sees it now (status, anonymity, closed). */
  conversation: Conversation | null;
  hasMore: boolean;
  messages: Message[];
  /** When the other person last read the conversation ("seen"). */
  peerReadAt: string | null;
};

export type OutgoingMessage = {
  /** Generated on the device, so a retry is never stored twice. */
  clientId: string;
  content?: string;
  image?: { fileName?: string | null; mimeType?: string | null; uri: string };
};

const MOCK_PEER: PostAuthor = {
  avatarUrl: null,
  displayName: 'Mai Anh',
  id: 'mock-peer-1',
  username: 'maianh',
};
const mockMessages: Message[] = [
  {
    content: 'Chào bạn, cuối tuần này đi cà phê không?',
    conversationId: 'mock-conversation-1',
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    id: 'mock-message-1',
    imageUrl: null,
    senderId: MOCK_PEER.id,
  },
];

function mockConversation(): Conversation {
  return {
    anonymous: null,
    canSendImages: true,
    closed: false,
    id: 'mock-conversation-1',
    isRequest: false,
    status: 'ACCEPTED',
    lastMessage: mockMessages[0] ?? null,
    lastMessageAt: mockMessages[0]?.createdAt ?? new Date().toISOString(),
    peer: MOCK_PEER,
    unreadCount: 0,
  };
}

export const messageService = {
  /** Conversations that already have messages, newest first. */
  async list(): Promise<Conversation[]> {
    if (USE_MOCK_API) {
      return [mockConversation()];
    }

    const response = await httpClient.requestJson<{ data: Conversation[] }>({
      method: 'GET',
      path: 'conversations',
    });

    return response.data;
  },

  /** The conversation with a user, created on first use. */
  async open(userId: string): Promise<Conversation> {
    if (USE_MOCK_API) {
      return mockConversation();
    }

    const response = await httpClient.requestJson<{ data: Conversation }, { userId: string }>({
      body: { userId },
      method: 'POST',
      path: 'conversations',
    });

    return response.data;
  },

  /** Anonymous conversation with someone who accepts anonymous messages (from their profile). */
  async openAnonymous(userId: string): Promise<Conversation> {
    if (USE_MOCK_API) {
      return {
        ...mockConversation(),
        anonymous: { revealed: false, role: 'SENDER' },
        canSendImages: false,
        id: 'mock-anonymous-1',
        status: 'PENDING',
      };
    }

    const response = await httpClient.requestJson<{ data: Conversation }, { userId: string }>({
      body: { userId },
      method: 'POST',
      path: 'conversations/anonymous',
    });

    return response.data;
  },

  /** One page of messages, newest first; `before` is the oldest `createdAt` already loaded. */
  async getMessages(conversationId: string, before?: string): Promise<MessagePage> {
    if (USE_MOCK_API) {
      return {
        conversation: mockConversation(),
        hasMore: false,
        messages: before ? [] : [...mockMessages],
        peerReadAt: null,
      };
    }

    const query = before ? `?before=${encodeURIComponent(before)}` : '';
    const response = await httpClient.requestJson<{
      data: Message[];
      meta: { conversation?: Conversation; hasMore: boolean; peerReadAt: string | null };
    }>({
      method: 'GET',
      path: `conversations/${conversationId}/messages${query}`,
    });

    return {
      conversation: response.meta.conversation ?? null,
      hasMore: response.meta.hasMore,
      messages: response.data,
      peerReadAt: response.meta.peerReadAt,
    };
  },

  /** Accept a message request without replying. */
  async accept(conversationId: string): Promise<void> {
    if (!USE_MOCK_API) {
      await httpClient.requestVoid({ method: 'POST', path: `conversations/${conversationId}/accept` });
    }
  },

  /** Remove a message request from your inbox. The sender is not told. */
  async decline(conversationId: string): Promise<void> {
    if (!USE_MOCK_API) {
      await httpClient.requestVoid({ method: 'POST', path: `conversations/${conversationId}/decline` });
    }
  },

  /** Recipient of an anonymous conversation: block that hidden sender for good. */
  async closeAnonymous(conversationId: string): Promise<void> {
    if (!USE_MOCK_API) {
      await httpClient.requestVoid({ method: 'POST', path: `conversations/${conversationId}/close` });
    }
  },

  /** Anonymous sender: show who you are. Cannot be undone. */
  async reveal(conversationId: string): Promise<Conversation | null> {
    if (USE_MOCK_API) {
      return null;
    }

    const response = await httpClient.requestJson<{ data: Conversation }>({
      method: 'POST',
      path: `conversations/${conversationId}/reveal`,
    });

    return response.data;
  },

  async send(conversationId: string, senderId: string, message: OutgoingMessage): Promise<Message> {
    if (USE_MOCK_API) {
      const sent: Message = {
        content: message.content ?? null,
        conversationId,
        createdAt: new Date().toISOString(),
        id: message.clientId,
        imageUrl: message.image?.uri ?? null,
        senderId,
      };

      mockMessages.unshift(sent);

      return sent;
    }

    if (message.image) {
      const form = new FormData();

      form.append('clientId', message.clientId);

      if (message.content) {
        form.append('content', message.content);
      }

      form.append('image', toUploadPart(message.image.uri, 0, message.image) as unknown as Blob);

      const response = await httpClient.requestForm<{ data: Message }>({
        form,
        method: 'POST',
        path: `conversations/${conversationId}/messages`,
      });

      return response.data;
    }

    const response = await httpClient.requestJson<
      { data: Message },
      { clientId: string; content?: string }
    >({
      body: { clientId: message.clientId, content: message.content },
      method: 'POST',
      path: `conversations/${conversationId}/messages`,
    });

    return response.data;
  },

  async markRead(conversationId: string): Promise<void> {
    if (USE_MOCK_API) {
      return;
    }

    await httpClient.requestVoid({ method: 'POST', path: `conversations/${conversationId}/read` });
  },

  /** Unread conversations in the main inbox (the tab badge) and pending requests. */
  async getUnreadCounts(): Promise<UnreadCounts> {
    if (USE_MOCK_API) {
      return { count: 0, requests: 0 };
    }

    const response = await httpClient.requestJson<{ data: { count: number; requests?: number } }>({
      method: 'GET',
      path: 'conversations/unread-count',
    });

    return { count: response.data.count, requests: response.data.requests ?? 0 };
  },
} as const;
