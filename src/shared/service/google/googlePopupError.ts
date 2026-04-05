import { GoogleClientConfigError } from '@shared/lib/googleApi';

export const GOOGLE_AUTH_POPUP_BLOCKED_ERROR = 'popup_failed_to_open';

export const isGoogleAuthPopupBlocked = (error: unknown): boolean => {
  if (error instanceof GoogleClientConfigError) {
    return error.type === GOOGLE_AUTH_POPUP_BLOCKED_ERROR;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();

  return (
    errorMessage.includes(GOOGLE_AUTH_POPUP_BLOCKED_ERROR) ||
    (errorMessage.includes('popup') && errorMessage.includes('open'))
  );
};
