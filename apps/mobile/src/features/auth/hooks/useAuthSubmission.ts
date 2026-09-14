import { useCallback, useRef, useState } from 'react';

import { ApiError } from '../../../services/apiError';
import { AuthContractUnavailableError } from '../services/authService';

export type AuthSubmissionState = 'error' | 'idle' | 'submitting';
export type AuthSubmissionTone = 'error' | 'info';

type SubmissionMessage = {
  text: string;
  tone: AuthSubmissionTone;
};

function getSubmissionMessage(error: unknown): SubmissionMessage {
  if (error instanceof AuthContractUnavailableError) {
    return {
      text: 'Authentication is not connected yet. No request was sent.',
      tone: 'info',
    };
  }

  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'configuration':
        return { text: 'This app does not have an API URL configured.', tone: 'error' };
      case 'network':
        return { text: 'Unable to reach the server. Check your connection and try again.', tone: 'error' };
      case 'unauthorized':
        return { text: 'The server did not authorize this request.', tone: 'error' };
      case 'server':
        return { text: 'The server could not complete this request.', tone: 'error' };
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
