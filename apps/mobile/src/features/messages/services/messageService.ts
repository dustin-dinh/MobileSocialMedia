/**
 * Direct messages — data-access layer. Mock mode keeps a small in-memory
 * inbox; live mode talks to `/conversations` (see docs/api-contract.md).
 */
import { USE_MOCK_API } from '../../../config/runtime';
import { httpClient } from '../../../services/httpClient';
import type { PostAuthor } from '../../feed/types';
import { toUploadPart } from '../../post/services/postService';

export type Message = {
  content: string | null;
  conversationId: string;
  createdAt: string;
  /** Local only: the send failed and can be retried. */
  failed?: boolean;
  id: string;
  imageUrl: string | null;
  /** Local only: shown at once, still on its way to the server. */
  pending?: boolean;
  senderId: string;
};

export type Conversation = {
  id: string;
  lastMessage: Message | null;
  lastMessageAt: string;
  peer: PostAuthor;
  unreadCount: number;
};

export type MessagePage = {
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
    id: 'mock-conversation-1',
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

  /** One page of messages, newest first; `before` is the oldest `createdAt` already loaded. */
  async getMessages(conversationId: string, before?: string): Promise<MessagePage> {
    if (USE_MOCK_API) {
      return { hasMore: false, messages: before ? [] : [...mockMessages], peerReadAt: null };
    }

    const query = before ? `?before=${encodeURIComponent(before)}` : '';
    const response = await httpClient.requestJson<{
      data: Message[];
      meta: { hasMore: boolean; peerReadAt: string | null };
    }>({
      method: 'GET',
      path: `conversations/${conversationId}/messages${query}`,
    });

    return {
      hasMore: response.meta.hasMore,
      messages: response.data,
      peerReadAt: response.meta.peerReadAt,
    };
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

  /** How many conversations hold unread messages (the tab badge). */
  async getUnreadCount(): Promise<number> {
    if (USE_MOCK_API) {
      return 0;
    }

    const response = await httpClient.requestJson<{ data: { count: number } }>({
      method: 'GET',
      path: 'conversations/unread-count',
    });

    return response.data.count;
  },
} as const;
