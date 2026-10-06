import { useCallback, useRef, useState } from 'react';

import { ApiError } from '../../../services/apiError';
import { GoogleSignInError } from '../services/googleSignIn';

export type AuthSubmissionState = 'error' | 'idle' | 'submitting';
export type AuthSubmissionTone = 'error' | 'info';

type SubmissionMessage = {
  text: string;
  tone: AuthSubmissionTone;
};

function getSubmissionMessage(error: unknown): SubmissionMessage {
  if (error instanceof GoogleSignInError) {
    if (error.code === 'play_services_unavailable') {
      return { text: 'Google Play Services is unavailable on this device.', tone: 'error' };
    }

    return { text: error.message || 'Something went wrong. Please try again.', tone: 'error' };
  }

  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'configuration':
        return { text: 'This app does not have an API URL configured.', tone: 'error' };
      case 'network':
        return { text: 'Unable to reach the server. Check your connection and try again.', tone: 'error' };
      case 'unauthorized':
        return { text: error.message, tone: 'error' };
      case 'server':
        return { text: error.message, tone: 'error' };
      default:
        return { text: 'Something went wrong. Please try again.', tone: 'error' };
    }
  }

  return { text: 'Something went wrong. Please try again.', tone: 'error' };
}

export function useAuthSubmission() {
  const [submissionMessage, setSubmissionMessage] = useState<SubmissionMessage | null>(null);
  const [submissionState, setSubmissionState] = useState<AuthSubmissionState>('idle');
  const isSubmittingRef = useRef(false);

  const reset = useCallback(() => {
    if (isSubmittingRef.current) {
      return;
    }

    setSubmissionMessage(null);
    setSubmissionState('idle');
  }, []);

  const submit = useCallback(async <T>(operation: () => Promise<T>): Promise<T | undefined> => {
    if (isSubmittingRef.current) {
      return undefined;
    }

    isSubmittingRef.current = true;
    setSubmissionMessage(null);
    setSubmissionState('submitting');

    try {
      const result = await operation();

      setSubmissionState('idle');
      return result;
    } catch (error) {
      if (error instanceof GoogleSignInError) {
        if (error.code === 'cancelled' || error.code === 'in_progress') {
          setSubmissionState('idle');
          setSubmissionMessage(null);
          return undefined;
        }
      }

      setSubmissionMessage(getSubmissionMessage(error));
      setSubmissionState('error');
      return undefined;
    } finally {
      isSubmittingRef.current = false;
    }
  }, []);

  return {
    isSubmitting: submissionState === 'submitting',
    reset,
    submit,
    submissionMessage: submissionMessage?.text ?? null,
    submissionState,
    submissionTone: submissionMessage?.tone ?? 'info',
  };
}
