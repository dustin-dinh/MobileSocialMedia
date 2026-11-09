/**
 * Account service — password change, account deletion and first-run setup
 * for the signed-in user.
 */
import { USE_MOCK_API } from '../../config/runtime';
import { httpClient } from '../../services/httpClient';

function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 400));
}

export const accountService = {
  /**
   * Change the password. `currentPassword` is omitted for Google-only
   * accounts, which are setting a password for the first time.
   */
  async changePassword(
    currentPassword: string | undefined,
    newPassword: string,
  ): Promise<{ accessToken?: string }> {
    if (USE_MOCK_API) {
      await mockDelay();

      return {};
    }

    // The server signs out every other device and returns a new token for this one.
    const response = await httpClient.requestJson<
      { data: { accessToken?: string } },
      { currentPassword?: string; newPassword: string }
    >({
      body: { currentPassword, newPassword },
      method: 'PATCH',
      path: 'auth/password',
    });

    return { accessToken: response.data.accessToken };
  },

  /** Turn two-factor sign-in on or off; always confirmed with the current password. */
  async setTwoFactor(enabled: boolean, currentPassword: string): Promise<void> {
    if (USE_MOCK_API) {
      await mockDelay();

      return;
    }

    await httpClient.requestVoid<{ currentPassword: string; enabled: boolean }>({
      body: { currentPassword, enabled },
      method: 'PATCH',
      path: 'auth/2fa',
    });
  },

  /**
   * Permanently delete the account. Accounts with a password confirm with it;
   * Google-only accounts confirm by typing their username.
   */
  async deleteAccount(confirmation: { confirm?: string; password?: string }): Promise<void> {
    if (USE_MOCK_API) {
      await mockDelay();

      return;
    }

    await httpClient.requestVoid<{ confirm?: string; password?: string }>({
      body: confirmation,
      method: 'DELETE',
      path: 'users/me',
    });
  },

  /**
   * Declare the date of birth (YYYY-MM-DD), once. `ageLocked`: under 18, the
   * server has locked the account and further requests are refused.
   */
  async setBirthDate(birthDate: string): Promise<{ ageLocked: boolean }> {
    if (USE_MOCK_API) {
      await mockDelay();

      return { ageLocked: false };
    }

    const response = await httpClient.requestJson<
      { data: { ageLocked: boolean } },
      { birthDate: string }
    >({
      body: { birthDate },
      method: 'PATCH',
      path: 'users/me/birth-date',
    });

    return { ageLocked: response.data.ageLocked };
  },

  /** Let anonymous senders message this account (asked only after the risk warning). */
  async setAllowAnonymousMessages(allow: boolean): Promise<void> {
    if (USE_MOCK_API) {
      await mockDelay();

      return;
    }

    await httpClient.requestVoid<{ allowAnonymousMessages: boolean }>({
      body: { allowAnonymousMessages: allow },
      method: 'PATCH',
      path: 'users/me',
    });
  },

  /** Who may start a new conversation with this account. */
  async setMessagePermission(messagePermission: 'EVERYONE' | 'FOLLOWING'): Promise<void> {
    if (USE_MOCK_API) {
      await mockDelay();

      return;
    }

    await httpClient.requestVoid<{ messagePermission: 'EVERYONE' | 'FOLLOWING' }>({
      body: { messagePermission },
      method: 'PATCH',
      path: 'users/me',
    });
  },

  /** Mark the first-run setup as finished (or skipped) so it is not shown again. */
  async completeOnboarding(): Promise<void> {
    if (USE_MOCK_API) {
      return;
    }

    await httpClient.requestVoid({ method: 'POST', path: 'users/me/onboarding/complete' });
  },
} as const;
