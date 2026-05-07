import { createGlobalState } from '@vueuse/core';
import { useFileSystemService } from '../fileSystem';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { googleDriveFileSystemProvider } from '@shared/lib/googleDriveFileSystemProvider';
import { useGoogleSessionStoreService, type GoogleSessionStore } from './googleSessionStore';
import { USER_INFO_GOOGLE_SCOPE, zodGOOGLE_SCOPE, type GOOGLE_SCOPE } from '@shared/lib/googleApi';
import { isEqual, isSubset, omit } from 'es-toolkit';
import { zodIs } from '@shared/lib/validateZodScheme';
import type { ObservableSource } from '@shared/lib/useObservable';
import { fromObservable } from '@shared/lib/useObservable';
import { dedupe } from '@shared/lib/dedupe';
import stringify from 'safe-stable-stringify';
import { GoogleAuthError, GoogleAuthErrorCode } from './errors';
import { isGoogleAuthPopupBlocked } from './googlePopupError';
import { distinctUntilChanged, map } from 'rxjs';
import { keys } from '@shared/lib/objectKeys';
import type { GoogleSessionProfile } from './googleSessionProfile';
import type { IFileSystemProvider } from '@shared/lib/virtualFileSystem';
import pLimit from 'p-limit';

type TokenResponse = google.accounts.oauth2.TokenResponse;
type UserinfoResult = Awaited<ReturnType<GoogleApi['userinfoGet']>>['result'];

type RequestAccessToken = (scopes: GOOGLE_SCOPE[], email?: string) => Promise<TokenResponse>;

/** Lazy Google API adapter used by the shared Google service. */
export interface GoogleApi {
  /** Requests an access token for the requested scopes and optional expected account. */
  requestAccessToken: RequestAccessToken;
  /** Reads the Google userinfo profile for the active token. */
  userinfoGet: (p: {
    oauth_token?: string | undefined;
  }) => Promise<{ result: { email?: string; name?: string; picture?: string } }>;
  /** Revokes an existing Google access token. */
  revoke: (accessToken: string) => Promise<void>;
}

export const GOOGLE_DRIVE_ROOT_NAME = 'Google Drive';
export const GOOGLE_DRIVE_ROOT_DESCRIPTION = 'Cloud storage from Google Drive';

/** Session record exposed to UI layers. */
export type GoogleSessionDisplay = {
  /** Stable Google account email. */
  email: string;
  /** Cached profile snapshot for the account. */
  profile: GoogleSessionProfile;
};

/** Shared Google integration contract used by the app service facade. */
export type GoogleService = {
  /** Binds the lazy Google API implementation without mounting Drive. */
  bindGoogleApi: (api: GoogleApi) => Promise<void>;
  /** Applies the desired Google Drive mounted state into the shared VFS. */
  setGoogleDriveIntegrationEnabled: (enabled: boolean) => Promise<void>;
  /** Mounts the Google Drive provider into the shared VFS. */
  enableGoogleDriveIntegration: () => Promise<void>;
  /** Unmounts Google Drive without deleting sessions or revoking access. */
  disableGoogleDriveIntegration: () => Promise<void>;
  /** Returns a reusable token for the requested Google scopes. */
  requestToken: (scopes: GOOGLE_SCOPE[], expectedEmail?: string) => Promise<string>;
  /** Clears all persisted local Google sessions. */
  clear: () => Promise<void>;
  /** Reactive list of locally known Google sessions. */
  sessionList: ObservableSource<GoogleSessionDisplay[]>;
  /** Deletes one persisted local Google session without revoking remote access. */
  deleteSession: (email: string) => Promise<void>;
  /** Revokes remote access for a session and then removes it locally. */
  revokeAccess: (email: string) => Promise<void>;
};

const setupGoogleService = (): GoogleService => {
  let googleApi: undefined | GoogleApi;
  let googleDriveIntegrationEnabled = false;
  let desiredGoogleDriveIntegrationEnabled = false;
  let googleDriveProvider: IFileSystemProvider | undefined;
  const applyGoogleDriveIntegrationLimit = pLimit(1);

  const {
    $store: $sessionStore,
    getStore,
    update,
    get,
    clear: clearSessions,
    $sessions,
  } = useGoogleSessionStoreService();
  const mergeProfile = (
    email: string,
    {
      nextProfile,
      storedProfile,
    }: {
      nextProfile?: GoogleSessionProfile | undefined;
      storedProfile?: GoogleSessionProfile | undefined;
    } = {},
  ): GoogleSessionProfile => nextProfile ?? storedProfile ?? { email };
  const getSessionDisplayList = (sessionStore: GoogleSessionStore): GoogleSessionDisplay[] =>
    keys(sessionStore).flatMap((email) => {
      const session = sessionStore[email];

      if (!session) {
        return [];
      }

      return [
        {
          email,
          profile: mergeProfile(email, {
            storedProfile: session.profile,
          }),
        },
      ];
    });
  const sessionList = fromObservable(
    $sessionStore.pipe(
      map(getSessionDisplayList),
      distinctUntilChanged((previous, current) => isEqual(previous, current)),
    ),
  );

  const normalizeScopes = (scopes: GOOGLE_SCOPE[]): GOOGLE_SCOPE[] => [...new Set(scopes)].sort();
  const hasAllRequiredScopes = (
    availableScopes: readonly GOOGLE_SCOPE[],
    requiredScopes: readonly GOOGLE_SCOPE[],
  ) =>
    // Verified against es-toolkit@1.45.1: isSubset(superset, subset).
    isSubset(availableScopes, requiredScopes);
  const toGoogleSessionProfile = ({
    email,
    name,
    picture,
  }: UserinfoResult): GoogleSessionProfile | undefined => {
    if (!email) {
      return undefined;
    }

    const profile: GoogleSessionProfile = { email };

    if (name) {
      profile.name = name;
    }

    if (picture) {
      profile.picture = picture;
    }

    return profile;
  };
  const buildRequestKey = (...args: unknown[]) => {
    const [rawScopes, rawOldEmail] = args;
    const scopes = Array.isArray(rawScopes)
      ? rawScopes.filter((scope): scope is GOOGLE_SCOPE => zodIs(scope, zodGOOGLE_SCOPE))
      : [];
    const oldEmail = typeof rawOldEmail === 'string' ? rawOldEmail : undefined;

    return (
      stringify({
        oldEmail,
        scopes: normalizeScopes([...scopes, USER_INFO_GOOGLE_SCOPE.userinfoEmail]),
      }) ?? 'undefined'
    );
  };

  const requestFreshToken = dedupe(
    async (scopes: GOOGLE_SCOPE[], expectedEmail?: string): Promise<string> => {
      if (!googleApi) {
        throw new Error('Google API is not tied to the service');
      }

      const requestScopes = normalizeScopes([...scopes, USER_INFO_GOOGLE_SCOPE.userinfoEmail]);

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

      const { access_token: accessToken, expires_in, scope: newScope } = tokenResponse;

      const availableScopes = newScope.split(' ').filter((v) => zodIs(v, zodGOOGLE_SCOPE));

      const expiresAt = Date.now() + parseInt(expires_in) * 1e3;

      const { result } = await userinfoGet({ oauth_token: accessToken });
      const profile = toGoogleSessionProfile(result);
      const email = profile?.email;

      if (!email) {
        throw new Error("don't have email");
      }

      const oldStore = await getStore();
      const previousSession = oldStore[email];

      const store = {
        ...oldStore,
        [email]: {
          accessToken,
          expiresAt,
          profile: mergeProfile(email, {
            nextProfile: profile,
            storedProfile: previousSession?.profile,
          }),
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

  const requestToken = async (scopes: GOOGLE_SCOPE[], expectedEmail?: string): Promise<string> => {
    const oldSession = expectedEmail ? await get(expectedEmail) : undefined;
    const requiredScopes = normalizeScopes([...scopes, USER_INFO_GOOGLE_SCOPE.userinfoEmail]);

    if (oldSession) {
      const { accessToken, expiresAt, scopes: oldScopes } = oldSession;
      if (
        expiresAt - 3e5 /** 5 min */ > Date.now() &&
        hasAllRequiredScopes(oldScopes, requiredScopes)
      ) {
        return accessToken;
      }
    }

    return requestFreshToken(scopes, expectedEmail);
  };

  const { vfs } = useFileSystemService();
  const googleDrivePath = PathUtils.join('/', GOOGLE_DRIVE_ROOT_NAME);
  const getGoogleDriveProvider = (): IFileSystemProvider => {
    googleDriveProvider ??= googleDriveFileSystemProvider({
      $sessions,
      requestToken,
    });

    return googleDriveProvider;
  };
  const applyGoogleDriveIntegrationState = (enabled: boolean): void => {
    if (enabled) {
      vfs.mount(googleDrivePath, getGoogleDriveProvider());
      googleDriveIntegrationEnabled = true;
      return;
    }

    vfs.unmount(googleDrivePath);
    googleDriveIntegrationEnabled = false;
  };
  const setGoogleDriveIntegrationEnabled = (enabled: boolean): Promise<void> => {
    desiredGoogleDriveIntegrationEnabled = enabled;

    return applyGoogleDriveIntegrationLimit(() => {
      const nextEnabled = desiredGoogleDriveIntegrationEnabled;
      if (googleDriveIntegrationEnabled !== nextEnabled) {
        applyGoogleDriveIntegrationState(nextEnabled);
      }
    });
  };

  const bindGoogleApi = (api: GoogleApi) => {
    googleApi = api;
    return Promise.resolve();
  };

  const enableGoogleDriveIntegration = async () => {
    await setGoogleDriveIntegrationEnabled(true);
  };

  const disableGoogleDriveIntegration = () => {
    return setGoogleDriveIntegrationEnabled(false);
  };

  const deleteSession = async (email: string) => {
    const store = await getStore();

    await update(omit(store, [email]));
  };

  const clear = async () => {
    await clearSessions();
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
    setGoogleDriveIntegrationEnabled,
    enableGoogleDriveIntegration,
    disableGoogleDriveIntegration,
    requestToken,
    clear,
    sessionList,
    deleteSession,
    revokeAccess,
  } satisfies GoogleService;
};

export const useGoogleService = createGlobalState(setupGoogleService);
