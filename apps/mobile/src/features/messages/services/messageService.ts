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

// Mock inbox for UI work and demos: four accepted conversations (two unread) and one
// request from a stranger, each with its own messages. It also shows the safety marks:
// a blurred sensitive image and a message the scam check flagged.
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=120&h=120&fit=crop&crop=face`;

type MockThread = Omit<Conversation, 'lastMessage' | 'lastMessageAt'> & { messages: Message[] };

function thread(
  id: string,
  peer: PostAuthor,
  lines: [from: 'me' | 'peer', text: string, minutes: number, flags?: Partial<Message>][],
  extra: Partial<MockThread> = {},
): MockThread {
  return {
    anonymous: null,
    canSendImages: true,
    closed: false,
    id,
    isRequest: false,
    peer,
    status: 'ACCEPTED',
    unreadCount: 0,
    ...extra,
    messages: lines.map(([from, content, minutes, flags], i) => ({
      content,
      conversationId: id,
      createdAt: minutesAgo(minutes),
      id: `${id}-m${i}`,
      imageUrl: null,
      senderId: from === 'me' ? 'user-001' : peer.id,
      ...flags,
    })),
  };
}

const mockThreads: MockThread[] = [
  thread(
    'mock-conversation-1',
    { avatarUrl: null, displayName: 'Mai Anh', id: 'mock-peer-1', username: 'maianh' },
    [['peer', 'Chào bạn, cuối tuần này đi cà phê không?', 60]],
    { unreadCount: 1 },
  ),
  thread(
    'mock-conversation-2',
    { avatarUrl: unsplash('1494790108377-be9c29b29330'), displayName: 'Minh Trần', id: 'user-003', username: 'minhtran' },
    [
      ['peer', 'Ảnh ruộng bậc thang hôm qua đẹp quá, bạn chụp bằng máy gì vậy?', 95],
      ['me', 'Mình chụp bằng điện thoại thôi, chỉnh màu nhẹ trên app.', 90],
      ['peer', 'Gửi mình bản gốc được không? Mình muốn in ra treo phòng.', 14],
      ['peer', '', 12, {
        content: null,
        imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&fit=crop',
        sensitive: true,
      }],
    ],
    { unreadCount: 2 },
  ),
  thread(
    'mock-conversation-3',
    { avatarUrl: unsplash('1438761681033-6461ffad8d80'), displayName: 'Linh Phạm', id: 'user-005', username: 'linhpham' },
    [
      ['me', 'Thứ Sáu này team họp lúc mấy giờ nhỉ?', 300],
      ['peer', '9 giờ sáng nha, phòng họp tầng 3.', 280],
    ],
  ),
  thread(
    'mock-conversation-4',
    { avatarUrl: unsplash('1500648767791-00dcc994a43e'), displayName: 'Đức Hoàng', id: 'user-006', username: 'duchoang' },
    [
      ['peer', 'Bài viết về race condition hay lắm, cảm ơn bạn.', 2_900],
      ['me', 'Cảm ơn bạn đã đọc!', 2_880],
    ],
  ),
  thread(
    'mock-request-1',
    { avatarUrl: null, displayName: 'Quốc Bảo', id: 'mock-stranger-1', username: 'quocbao.92' },
    [
      ['peer', 'Chào bạn, mình thấy bạn qua bài viết về Đà Nẵng, cho mình làm quen nhé.', 40],
      ['peer', 'Bạn chuyển trước 500k để giữ chỗ nhé, rồi gửi mình mã OTP ngân hàng để xác nhận.', 38, { warning: true }],
    ],
    { isRequest: true, status: 'PENDING', unreadCount: 1 },
  ),
];

function mockConversation(id = 'mock-conversation-1'): Conversation {
  const found = mockThreads.find((t) => t.id === id) ?? mockThreads[0];
  const { messages, ...conversation } = found;

  return {
    ...conversation,
    lastMessage: messages[messages.length - 1] ?? null,
    lastMessageAt: messages[messages.length - 1]?.createdAt ?? new Date().toISOString(),
  };
}

function mockInbox(): Conversation[] {
  return mockThreads
    .map((t) => mockConversation(t.id))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

/** Newest first, as the API pages them. */
const mockMessagesOf = (id: string) => [...(mockThreads.find((t) => t.id === id)?.messages ?? [])].reverse();

export const messageService = {
  /** Conversations that already have messages, newest first. */
  async list(): Promise<Conversation[]> {
    if (USE_MOCK_API) {
      return mockInbox();
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
        conversation: mockConversation(conversationId),
        hasMore: false,
        messages: before ? [] : mockMessagesOf(conversationId),
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

      mockThreads.find((t) => t.id === conversationId)?.messages.push(sent);

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
      // Counted from the mock inbox so the tab badge and the folders agree.
      return {
        count: mockThreads.filter((t) => !t.isRequest && t.unreadCount > 0).length,
        requests: mockThreads.filter((t) => t.isRequest).length,
      };
    }

    const response = await httpClient.requestJson<{ data: { count: number; requests?: number } }>({
      method: 'GET',
      path: 'conversations/unread-count',
    });

    return { count: response.data.count, requests: response.data.requests ?? 0 };
  },
} as const;
