/**
 * Live integration suite for the safety features of 2026-10-17, through the
 * real Mobile services: birth date, message requests, conversation reports.
 * Anonymous conversations and story reactions are covered at the API level
 * by apps/api/scripts/safety-smoke.cjs (they need test accounts older than 7 days).
 *
 *   # in apps/api — fresh test accounts (gaptest_a / gaptest_b)
 *   node scripts/seed-test-users.cjs clean && node scripts/seed-test-users.cjs
 *
 *   # in apps/mobile, with the backend running
 *   LIVE_API=1 EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000/api \
 *     corepack pnpm exec jest __tests__/live/safetyLive
 */
import * as SecureStore from 'expo-secure-store';

import { authService } from '../../src/features/auth/services/authService';
import type { AuthUser } from '../../src/features/auth/services/authService';
import { messageService } from '../../src/features/messages/services/messageService';
import { reportService } from '../../src/features/report/reportService';
import { accountService } from '../../src/features/settings/accountService';
import { ApiError } from '../../src/services/apiError';
import { followApi } from '../../src/services/followApi';
import { installNodeFetch } from './nodeFetch';

const describeLive = process.env.LIVE_API === '1' ? describe : describe.skip;

type Account = { token: string; user: AuthUser };

// Seeded by apps/api/scripts/seed-test-users.cjs.
const SEED_PASSWORD = 'Passw0rd!gap';

let activeToken: string | null = null;

async function signIn(tag: string): Promise<Account> {
  const { accessToken } = await authService.login({
    email: `gaptest_${tag}@example.invalid`,
    password: SEED_PASSWORD,
  });

  return { token: accessToken, user: await authService.getCurrentUser(accessToken) };
}

function actAs(account: Account): void {
  activeToken = account.token;
  followApi.clearCache();
}

describeLive('Safety features against the live API', () => {
  let alice: Account;
  let bob: Account;
  let conversationId: string;

  beforeAll(async () => {
    if (!process.env.LIVE_DEBUG) {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
    }
    installNodeFetch();
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(() => Promise.resolve(activeToken));

    alice = await signIn('a');
    bob = await signIn('b');
  }, 60_000);

  it('a seeded account has no birth date until it declares one, once', async () => {
    expect(alice.user.birthDate).toBeNull();

    actAs(alice);
    await expect(accountService.setBirthDate('1994-04-04')).resolves.toEqual({ ageLocked: false });
    expect((await authService.getCurrentUser(alice.token)).birthDate).toBe('1994-04-04');
    await expect(accountService.setBirthDate('1995-05-05')).rejects.toBeInstanceOf(ApiError);
  });

  it('a stranger opens a pending, text-only conversation', async () => {
    actAs(alice);
    const conversation = await messageService.open(bob.user.id);

    conversationId = conversation.id;
    expect(conversation).toMatchObject({ canSendImages: false, isRequest: false, status: 'PENDING' });

    await messageService.send(conversationId, alice.user.id, { clientId: `safety-${Date.now()}`, content: 'Chào bạn' });
    await expect(
      messageService.send(conversationId, alice.user.id, {
        clientId: `safety-phone-${Date.now()}`,
        content: 'gọi 0987 654 321 nhé',
      }),
    ).rejects.toMatchObject({ code: 'CONTACT_INFO_BLOCKED' });
  });

  it('the recipient sees a request, kept out of the inbox badge', async () => {
    actAs(bob);
    const conversations = await messageService.list();
    const request = conversations.find((conversation) => conversation.id === conversationId);

    expect(request?.isRequest).toBe(true);
    expect((await messageService.getUnreadCounts()).requests).toBeGreaterThanOrEqual(1);

    const page = await messageService.getMessages(conversationId);

    expect(page.conversation?.isRequest).toBe(true);
    expect(page.messages[0]).toMatchObject({ content: 'Chào bạn', warning: false });
  });

  it('accepting turns it into a normal conversation for both sides', async () => {
    actAs(bob);
    await messageService.accept(conversationId);

    actAs(alice);
    const page = await messageService.getMessages(conversationId);

    expect(page.conversation).toMatchObject({ canSendImages: true, isRequest: false, status: 'ACCEPTED' });
  });

  it('a conversation can be reported with the scam reason', async () => {
    actAs(bob);

    await expect(
      reportService.report({ id: conversationId, type: 'CONVERSATION' }, 'SCAM'),
    ).resolves.toBeUndefined();
  });
});
