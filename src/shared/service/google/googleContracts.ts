import type { GOOGLE_SCOPE } from '@shared/lib/googleApi';
import type { GoogleSessionProfile } from './googleSessionProfile';

export const GOOGLE_DRIVE_ROOT_NAME = 'Google Drive';

/** Lazy Google API adapter used by the shared Google service. */
export interface GoogleApi {
  /** Requests an access token for the requested scopes and optional expected account. */
  requestAccessToken: (
    scopes: GOOGLE_SCOPE[],
    email?: string,
  ) => Promise<google.accounts.oauth2.TokenResponse>;
  /** Reads the Google userinfo profile for the active token. */
  userinfoGet: (p: {
    oauth_token?: string | undefined;
  }) => Promise<{ result: { email?: string; name?: string; picture?: string } }>;
  /** Revokes an existing Google access token. */
  revoke: (accessToken: string) => Promise<void>;
}

/** Session record exposed to UI layers. */
export type GoogleSessionDisplay = {
  /** Stable Google account email. */
  email: string;
  /** Cached profile snapshot for the account. */
  profile: GoogleSessionProfile;
};

export { GoogleAuthError, GoogleAuthErrorCode } from './errors';
