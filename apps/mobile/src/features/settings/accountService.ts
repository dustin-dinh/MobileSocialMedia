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
  async changePassword(currentPassword: string | undefined, newPassword: string): Promise<void> {
    if (USE_MOCK_API) {
      await mockDelay();

      return;
    }

    await httpClient.requestVoid<{ currentPassword?: string; newPassword: string }>({
      body: { currentPassword, newPassword },
      method: 'PATCH',
      path: 'auth/password',
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

  /** Mark the first-run setup as finished (or skipped) so it is not shown again. */
  async completeOnboarding(): Promise<void> {
    if (USE_MOCK_API) {
      return;
    }

    await httpClient.requestVoid({ method: 'POST', path: 'users/me/onboarding/complete' });
  },
} as const;
