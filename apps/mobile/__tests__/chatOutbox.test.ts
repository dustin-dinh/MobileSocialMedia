import { chatOutbox } from '../src/features/messages/chatOutbox';
import type { Message } from '../src/features/messages/services/messageService';

const local = (id: string): Message => ({
  content: 'Chào',
  conversationId: 'c1',
  createdAt: new Date().toISOString(),
  id,
  imageUrl: null,
  pending: true,
  senderId: 'me',
});

describe('chat outbox (unsent messages outlive the chat screen)', () => {
  it('keeps pending and failed messages per user and conversation until sent', () => {
    const key = chatOutbox.key('me', 'c1');
    const events: [string, Message | undefined][] = [];
    const unsubscribe = chatOutbox.subscribe((changed, sent) => events.push([changed, sent]));

    chatOutbox.add(key, local('m1'), { clientId: 'm1', content: 'Chào' });
    chatOutbox.add(key, local('m2'), { clientId: 'm2', content: 'Bạn ơi' });
    chatOutbox.update(key, 'm1', { failed: true, pending: false });

    // Another account on the same phone sees nothing.
    expect(chatOutbox.messages(chatOutbox.key('other', 'c1'))).toEqual([]);
    expect(chatOutbox.messages(key).map((m) => [m.id, m.failed ?? false])).toEqual([
      ['m2', false],
      ['m1', true],
    ]);
    expect(chatOutbox.outgoing(key, 'm1')).toEqual({ clientId: 'm1', content: 'Chào' });

    const sent = { ...local('m1'), pending: false };
    chatOutbox.remove(key, 'm1', sent);
    chatOutbox.remove(key, 'm2');
    unsubscribe();
    chatOutbox.add(key, local('m3'), { clientId: 'm3' });

    expect(chatOutbox.messages(key).map((m) => m.id)).toEqual(['m3']);
    expect(events).toHaveLength(5);
    expect(events[3]).toEqual([key, sent]);
  });
});
