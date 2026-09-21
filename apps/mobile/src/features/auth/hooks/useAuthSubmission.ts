import { useCallback, useRef, useState } from 'react';

import { ApiError } from '../../../services/apiError';

export type AuthSubmissionState = 'error' | 'idle' | 'submitting';
export type AuthSubmissionTone = 'error' | 'info';

type SubmissionMessage = {
  text: string;
  tone: AuthSubmissionTone;
};

function getSubmissionMessage(error: unknown): SubmissionMessage {
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
