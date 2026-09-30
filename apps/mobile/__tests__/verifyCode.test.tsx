import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { maskEmail, VerifyCodeScreen } from '../src/features/auth/screens/VerifyCodeScreen';
import { passwordResetService } from '../src/features/auth/services/passwordResetService';
import { ApiError } from '../src/services/apiError';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      {children}
    </SafeAreaProvider>
  );
}

describe('VerifyCodeScreen (Phase 3)', () => {
  const mockNavigate = jest.fn();
  const mockNavigation = {
    navigate: mockNavigate,
    goBack: jest.fn(),
  } as any;
  const mockRoute = {
    params: {
      email: 'nhatluan@example.com',
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('maskEmail helper', () => {
    it('masks standard email usernames correctly', () => {
      expect(maskEmail('nhatluan@example.com')).toBe('n***n@example.com');
      expect(maskEmail('john@domain.org')).toBe('j***n@domain.org');
    });

    it('masks short usernames correctly', () => {
      expect(maskEmail('me@example.com')).toBe('m***@example.com');
      expect(maskEmail('a@b.com')).toBe('a***@b.com');
    });

    it('handles malformed strings gracefully', () => {
      expect(maskEmail('invalid-email')).toBe('invalid-email');
    });
  });

  describe('UI rendering & interactions', () => {
    it('renders masked email, code input, resend button, and verify button', async () => {
      const { getAllByText, getByLabelText, getByText } = await render(
        <TestWrapper>
          <VerifyCodeScreen navigation={mockNavigation} route={mockRoute} />
        </TestWrapper>,
      );

      expect(getAllByText('Verify code').length).toBe(2);
      expect(getByText(/n\*\*\*n@example\.com/)).toBeTruthy();
      expect(getByLabelText('Verification code input')).toBeTruthy();
      expect(getByLabelText('Resend code')).toBeTruthy();
      expect(getByLabelText('Verify code')).toBeTruthy();
      expect(getByLabelText('Back')).toBeTruthy();
    });

    it('only accepts numeric digits and caps at 6 digits', async () => {
      const { getByLabelText } = await render(
        <TestWrapper>
          <VerifyCodeScreen navigation={mockNavigation} route={mockRoute} />
        </TestWrapper>,
      );

      const input = getByLabelText('Verification code input');
      await act(async () => {
        fireEvent.changeText(input, '12ab34cd5678');
      });

      expect(input.props.value).toBe('123456');
    });

    it('keeps Verify button disabled when code is under 6 digits, enables when exactly 6 digits', async () => {
      const { getByLabelText } = await render(
        <TestWrapper>
          <VerifyCodeScreen navigation={mockNavigation} route={mockRoute} />
        </TestWrapper>,
      );

      const verifyButton = getByLabelText('Verify code');
      const input = getByLabelText('Verification code input');

      expect(verifyButton.props.accessibilityState?.disabled).toBe(true);

      await act(async () => {
        fireEvent.changeText(input, '12345');
      });
      expect(verifyButton.props.accessibilityState?.disabled).toBe(true);

      await act(async () => {
        fireEvent.changeText(input, '123456');
      });
      expect(verifyButton.props.accessibilityState?.disabled).toBe(false);
    });

    it('displays error message when incorrect code is submitted', async () => {
      jest.spyOn(passwordResetService, 'verifyResetCode').mockRejectedValueOnce(
        new ApiError({
          kind: 'server',
          message: 'Invalid or expired verification code.',
          status: 400,
        }),
      );

      const { getByLabelText, getByText } = await render(
        <TestWrapper>
          <VerifyCodeScreen navigation={mockNavigation} route={mockRoute} />
        </TestWrapper>,
      );

      const input = getByLabelText('Verification code input');
      const verifyButton = getByLabelText('Verify code');

      await act(async () => {
        fireEvent.changeText(input, '000000');
      });

      await act(async () => {
        fireEvent.press(verifyButton);
      });

      await waitFor(() => {
        expect(getByText('Invalid or expired verification code.')).toBeTruthy();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates back to Login with success message when code is correct', async () => {
      const verifySpy = jest.spyOn(passwordResetService, 'verifyResetCode').mockResolvedValueOnce({
        message: 'Verification code confirmed successfully.',
        success: true,
      });

      const { getByLabelText } = await render(
        <TestWrapper>
          <VerifyCodeScreen navigation={mockNavigation} route={mockRoute} />
        </TestWrapper>,
      );

      const input = getByLabelText('Verification code input');
      const verifyButton = getByLabelText('Verify code');

      await act(async () => {
        fireEvent.changeText(input, '123456');
      });

      await act(async () => {
        fireEvent.press(verifyButton);
      });

      await waitFor(() => {
        expect(verifySpy).toHaveBeenCalledWith('nhatluan@example.com', '123456');
        expect(mockNavigate).toHaveBeenCalledWith('Login', {
          email: 'nhatluan@example.com',
          message: 'Password reset verified. Please sign in.',
        });
      });
    });

    it('navigates back to ForgotPassword when Back button is tapped', async () => {
      const { getByLabelText } = await render(
        <TestWrapper>
          <VerifyCodeScreen navigation={mockNavigation} route={mockRoute} />
        </TestWrapper>,
      );

      await act(async () => {
        fireEvent.press(getByLabelText('Back'));
      });

      expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
    });
  });

  describe('Resend countdown and timer cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('disables Resend during 60s countdown, enables after 60s, and triggers request on click', async () => {
      const resendSpy = jest.spyOn(passwordResetService, 'requestResetCode').mockResolvedValueOnce({
        message: 'A verification code has been sent to your email.',
        success: true,
      });

      const { getByLabelText, getByText } = await render(
        <TestWrapper>
          <VerifyCodeScreen navigation={mockNavigation} route={mockRoute} />
        </TestWrapper>,
      );

      const resendButton = getByLabelText('Resend code');
      expect(resendButton.props.accessibilityState?.disabled).toBe(true);
      expect(getByText(/Resend code in 60s/)).toBeTruthy();

      // Advance 1s
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      expect(getByText(/Resend code in 59s/)).toBeTruthy();

      // Advance remaining 59s
      await act(async () => {
        jest.advanceTimersByTime(59000);
      });
      expect(getByText('Resend code')).toBeTruthy();
      expect(resendButton.props.accessibilityState?.disabled).toBe(false);

      // Tap Resend
      await act(async () => {
        fireEvent.press(resendButton);
      });

      expect(resendSpy).toHaveBeenCalledWith('nhatluan@example.com');
    });

    it('cleans up interval timer cleanly when unmounted without leaving hanging timers', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = await render(
        <TestWrapper>
          <VerifyCodeScreen navigation={mockNavigation} route={mockRoute} />
        </TestWrapper>,
      );

      await act(async () => {
        unmount();
      });

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });
});
