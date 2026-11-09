import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { RegisterScreen } from '../src/features/auth/screens/RegisterScreen';
import { VerifyCodeScreen } from '../src/features/auth/screens/VerifyCodeScreen';
import {
  authService,
  MOCK_TWO_FACTOR_CODE,
  TwoFactorRequiredError,
} from '../src/features/auth/services/authService';
import { httpClient } from '../src/services/httpClient';

describe('Account security (2026-11-01)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('Register stays disabled until the consent box is ticked', async () => {
    const { getByLabelText, getByRole } = await render(
      <RegisterScreen navigation={{ navigate: jest.fn(), replace: jest.fn() } as any} route={{} as any} />,
    );

    expect(getByLabelText('Tạo tài khoản').props.accessibilityState?.disabled).toBe(true);

    await act(async () => {
      fireEvent.press(getByRole('checkbox'));
    });

    expect(getByLabelText('Tạo tài khoản').props.accessibilityState?.disabled).toBe(false);
  });

  it('a two-factor login response becomes TwoFactorRequiredError, not a session', async () => {
    jest.spyOn(httpClient, 'requestJson').mockResolvedValueOnce({
      data: { challengeToken: 'challenge-1', email: 'a@example.invalid', twoFactorRequired: true },
    });

    const attempt = authService.login({ email: 'a@example.invalid', password: 'Passw0rd!' });

    await expect(attempt).rejects.toBeInstanceOf(TwoFactorRequiredError);
    await expect(attempt).rejects.toMatchObject({ challengeToken: 'challenge-1', email: 'a@example.invalid' });
  });

  it('mock two-factor step accepts only the mock code', async () => {
    await expect(authService.verifyTwoFactor('challenge-1', '000000')).rejects.toThrow(
      'Mã xác minh không đúng hoặc đã hết hạn.',
    );
    await expect(authService.verifyTwoFactor('challenge-1', MOCK_TWO_FACTOR_CODE)).resolves.toMatchObject({
      accessToken: expect.any(String),
    });
  });

  it('VerifyCodeScreen in two-factor mode resends with the challenge token', async () => {
    jest.useFakeTimers();
    const resend = jest.spyOn(authService, 'resendTwoFactor').mockResolvedValue();
    const navigate = jest.fn();
    const { getByLabelText, getByText } = await render(
      <VerifyCodeScreen
        navigation={{ goBack: jest.fn(), navigate } as any}
        route={{ params: { challengeToken: 'challenge-1', email: 'nhatluan@example.com', mode: 'twoFactor' } } as any}
      />,
    );

    expect(getByText('Xác thực hai lớp')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    await act(async () => {
      fireEvent.press(getByLabelText('Resend code'));
    });

    expect(resend).toHaveBeenCalledWith('challenge-1');

    await act(async () => {
      fireEvent.press(getByLabelText('Back'));
    });

    expect(navigate).toHaveBeenCalledWith('Login');
  });
});
