import { createGlobalState } from '@vueuse/core';
import { useFileSystemService } from '../fileSystem';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { googleDriveFileSystemProvider } from '@shared/lib/googleDriveFileSystemProvider';
import { useGoogleSessionStore } from './googleSessionStore';
import {
  USER_INFO_GOOGLE_SCOPE,
  zodGOOGLE_SCOPE,
  type GOOGLE_SCOPE,
} from '@shared/lib/googleApi';
import { isSubset, omit } from 'es-toolkit';
import { zodIs } from '@shared/lib/validateZodScheme';
import type { ObservableSource } from '@shared/lib/useObservable';
import { fromObservable } from '@shared/lib/useObservable';
import { dedupe } from '@shared/lib/dedupe';
import stringify from 'safe-stable-stringify';
import { GoogleAuthError, GoogleAuthErrorCode } from './errors';
import { isGoogleAuthPopupBlocked } from './googlePopupError';

type TokenResponse = google.accounts.oauth2.TokenResponse;

type RequestAccessToken = (
  scopes: GOOGLE_SCOPE[],
  email?: string,
) => Promise<TokenResponse>;

export interface GoogleApi {
  requestAccessToken: RequestAccessToken;
  userinfoGet: (p: {
    oauth_token?: string | undefined;
  }) => Promise<{ result: { email?: string } }>;
  revoke: (accessToken: string) => Promise<void>;
}

export const GOOGLE_DRIVE_ROOT_NAME = 'Google Drive';

export type GoogleService = {
  bindGoogleApi: (api: GoogleApi) => Promise<void>;
  requestToken: (
    scopes: GOOGLE_SCOPE[],
    expectedEmail?: string,
  ) => Promise<string>;
  clear: () => Promise<void>;
  sessions: ObservableSource<string[]>;
  deleteSession: (email: string) => Promise<void>;
  revokeAccess: (email: string) => Promise<void>;
};

const setupGoogleService = (): GoogleService => {
  let googleApi: undefined | GoogleApi;

  const { getStore, update, get, clear, $sessions } = useGoogleSessionStore();
  const sessions = fromObservable($sessions);

  const normalizeScopes = (scopes: GOOGLE_SCOPE[]): GOOGLE_SCOPE[] =>
    [...new Set(scopes)].sort();

  const buildRequestKey = (...args: unknown[]) => {
    const [rawScopes, rawOldEmail] = args;
    const scopes = Array.isArray(rawScopes)
      ? rawScopes.filter((scope): scope is GOOGLE_SCOPE =>
          zodIs(scope, zodGOOGLE_SCOPE),
        )
      : [];
    const oldEmail = typeof rawOldEmail === 'string' ? rawOldEmail : undefined;

    return (
      stringify({
        oldEmail,
        scopes: normalizeScopes([
          ...scopes,
          USER_INFO_GOOGLE_SCOPE.userinfoEmail,
        ]),
      }) ?? 'undefined'
    );
  };

  const requestFreshToken = dedupe(
    async (scopes: GOOGLE_SCOPE[], expectedEmail?: string): Promise<string> => {
      if (!googleApi) {
        throw new Error('Google API is not tied to the service');
      }

      const requestScopes = normalizeScopes([
        ...scopes,
        USER_INFO_GOOGLE_SCOPE.userinfoEmail,
      ]);

      const { requestAccessToken, userinfoGet } = googleApi;

      let tokenResponse: TokenResponse;

      try {
        tokenResponse = await requestAccessToken(requestScopes, expectedEmail);
      } catch (error) {
        if (isGoogleAuthPopupBlocked(error)) {
          throw new GoogleAuthError(
            {
              code: GoogleAuthErrorCode.popupBlocked,
              expectedEmail,
            },
            {
              cause: error,
            },
          );
        }

        if (expectedEmail) {
          throw new GoogleAuthError(
            {
              code: GoogleAuthErrorCode.reauthRequired,
              expectedEmail,
            },
            {
              cause: error,
            },
          );
        }

        throw error;
      }

      const {
        access_token: accessToken,
        expires_in,
        scope: newScope,
      } = tokenResponse;

      const availableScopes = newScope
        .split(' ')
        .filter((v) => zodIs(v, zodGOOGLE_SCOPE));

      const expiresAt = Date.now() + parseInt(expires_in) * 1e3;

      const {
        result: { email },
      } = await userinfoGet({ oauth_token: accessToken });

      if (!email) {
        throw new Error("don't have email");
      }

      const oldStore = await getStore();

      const store = {
        ...oldStore,
        [email]: {
          accessToken,
          expiresAt,
          scopes: availableScopes,
        },
      };

      await update(store);

      if (expectedEmail && expectedEmail !== email) {
        throw new GoogleAuthError({
          actualEmail: email,
          code: GoogleAuthErrorCode.accountMismatch,
          expectedEmail,
        });
      }

      return accessToken;
    },
    buildRequestKey,
  );

  const requestToken = async (
    scopes: GOOGLE_SCOPE[],
    expectedEmail?: string,
  ): Promise<string> => {
    const oldSession = expectedEmail ? await get(expectedEmail) : undefined;

    if (oldSession) {
      const { accessToken, expiresAt, scopes: oldScopes } = oldSession;
      if (
        expiresAt - 3e5 /** 5 min */ > Date.now() &&
        isSubset(oldScopes, scopes)
      ) {
        return accessToken;
      }
    }

    return requestFreshToken(scopes, expectedEmail);
  };

  const { vfs } = useFileSystemService();

  const mountGoogleProvider = async () => {
    const path = PathUtils.join('/', GOOGLE_DRIVE_ROOT_NAME);

    await vfs.createDirectory(path);

    vfs.mount(
      path,
      googleDriveFileSystemProvider({
        $sessions,
        requestToken,
      }),
    );
  };

  const bindGoogleApi = async (api: GoogleApi) => {
    googleApi = api;

    await mountGoogleProvider();
  };

  const deleteSession = async (email: string) => {
    const store = await getStore();

    await update(omit(store, [email]));
  };

  const revokeAccess = async (email: string) => {
    if (!googleApi) {
      throw new Error('Google API is not tied to the service');
    }

    const session = await get(email);

    if (!session) {
      return;
    }

    try {
      await googleApi.revoke(session.accessToken);
    } catch (error) {
      throw new GoogleAuthError(
        {
          code: GoogleAuthErrorCode.revokeFailed,
          email,
        },
        {
          cause: error,
        },
      );
    }

    await deleteSession(email);
  };

  return {
    bindGoogleApi,
    requestToken,
    clear,
    sessions,
    deleteSession,
    revokeAccess,
  } satisfies GoogleService;
};

export const useGoogleService = createGlobalState(setupGoogleService);
