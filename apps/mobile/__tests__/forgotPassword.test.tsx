import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ForgotPasswordScreen } from '../src/features/auth/screens/ForgotPasswordScreen';
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

describe('ForgotPasswordScreen (Phase 2)', () => {
  const mockNavigate = jest.fn();
  const mockNavigation = {
    navigate: mockNavigate,
    goBack: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders ForgotPasswordScreen with title, email input, Send code button, and Back link', async () => {
    const { getByLabelText, getByPlaceholderText, getByText } = await render(
      <TestWrapper>
        <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
      </TestWrapper>,
    );

    expect(getByText('Forgot password')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByLabelText('Email input')).toBeTruthy();
    expect(getByLabelText('Send reset code')).toBeTruthy();
    expect(getByLabelText('Back')).toBeTruthy();
  });

  it('shows validation error when email is empty on submit', async () => {
    const { getByLabelText, getByText } = await render(
      <TestWrapper>
        <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
      </TestWrapper>,
    );

    await act(async () => {
      fireEvent.press(getByLabelText('Send reset code'));
    });

    await waitFor(() => {
      expect(getByText('Enter your email address.')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows validation error when email format is invalid', async () => {
    const { getByLabelText, getByPlaceholderText, getByText } = await render(
      <TestWrapper>
        <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
      </TestWrapper>,
    );

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'invalid-email');
      fireEvent.press(getByLabelText('Send reset code'));
    });

    await waitFor(() => {
      expect(getByText('Enter a valid email address.')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('calls service and navigates to VerifyCode when email is valid', async () => {
    const requestSpy = jest.spyOn(passwordResetService, 'requestResetCode').mockResolvedValueOnce({
      message: 'Code sent',
      success: true,
    });

    const { getByLabelText, getByPlaceholderText } = await render(
      <TestWrapper>
        <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
      </TestWrapper>,
    );

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
      fireEvent.press(getByLabelText('Send reset code'));
    });

    await waitFor(() => {
      expect(requestSpy).toHaveBeenCalledWith('user@test.com');
      expect(mockNavigate).toHaveBeenCalledWith('VerifyCode', { email: 'user@test.com' });
    });
  });

  it('displays service error message without crashing when request fails', async () => {
    jest.spyOn(passwordResetService, 'requestResetCode').mockRejectedValueOnce(
      new ApiError({
        kind: 'server',
        message: 'Unable to send reset code. Please try again later.',
        status: 500,
      }),
    );

    const { getByLabelText, getByPlaceholderText, getByText } = await render(
      <TestWrapper>
        <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
      </TestWrapper>,
    );

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
      fireEvent.press(getByLabelText('Send reset code'));
    });

    await waitFor(() => {
      expect(getByText('Unable to send reset code. Please try again later.')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('disables button and shows loading state while submitting', async () => {
    let resolvePromise: (value: any) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    jest.spyOn(passwordResetService, 'requestResetCode').mockReturnValueOnce(pendingPromise as any);

    const { getByLabelText, getByPlaceholderText } = await render(
      <TestWrapper>
        <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
      </TestWrapper>,
    );

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
      fireEvent.press(getByLabelText('Send reset code'));
    });

    const button = getByLabelText('Send reset code');
    expect(button.props.accessibilityState?.disabled).toBe(true);

    await act(async () => {
      resolvePromise({ success: true, message: 'Done' });
    });
  });

  it('navigates back to Login when tapping Back button', async () => {
    const { getByLabelText } = await render(
      <TestWrapper>
        <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
      </TestWrapper>,
    );

    await act(async () => {
      fireEvent.press(getByLabelText('Back'));
    });
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});
