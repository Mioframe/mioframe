import { createGlobalState } from '@vueuse/core';
import { useFileSystemService } from '../fileSystem';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { googleDriveFileSystemProvider } from '@shared/lib/vfsProviders/google';
import { useGoogleSessionStore } from './googleSessionStore';
import {
  USER_INFO_GOOGLE_SCOPE,
  zodGOOGLE_SCOPE,
  type GOOGLE_SCOPE,
} from '@shared/lib/googleApi';
import { isSubset, omit } from 'es-toolkit';
import { zodIs } from '@shared/lib/validateZodScheme';
import type { ObservableDefinition } from '@shared/lib/useObservable';
import { defineObservable } from '@shared/lib/useObservable';

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
}

export const GOOGLE_DRIVE_ROOT_NAME = 'Google Drive';

export type GoogleService = {
  bindGoogleApi: (api: GoogleApi) => Promise<void>;
  requestToken: (scopes: GOOGLE_SCOPE[], oldEmail?: string) => Promise<string>;
  clear: () => Promise<void>;
  sessions: ObservableDefinition<string[]>;
  remove: (email: string) => Promise<void>;
};

const setupGoogleService = (): GoogleService => {
  let googleApi: undefined | GoogleApi;

  const { getStore, update, getSessionList, get, clear, $sessions } =
    useGoogleSessionStore();

  const requestToken = async (
    scopes: GOOGLE_SCOPE[],
    oldEmail?: string,
  ): Promise<string> => {
    const oldSession = oldEmail ? await get(oldEmail) : undefined;

    if (oldSession) {
      const { accessToken, expiresAt, scopes: oldScopes } = oldSession;
      if (
        expiresAt - 3e5 /** 5 min */ > Date.now() &&
        isSubset(oldScopes, scopes)
      ) {
        return accessToken;
      }
    }

    if (!googleApi) {
      throw new Error('Google API is not tied to the service');
    }

    const { requestAccessToken, userinfoGet } = googleApi;

    const {
      access_token: accessToken,
      expires_in,
      scope: newScope,
    } = await requestAccessToken(
      [...scopes, USER_INFO_GOOGLE_SCOPE.userinfoEmail],
      oldEmail,
    );

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

    const token = store[oldEmail ?? email]?.accessToken;

    if (!token) {
      throw new Error('Failed to get token');
    }

    return token;
  };

  const { vfs } = useFileSystemService();

  const mountGoogleProvider = async () => {
    const path = PathUtils.join('/', GOOGLE_DRIVE_ROOT_NAME);

    await vfs.createDirectory(path);

    vfs.mount(
      path,
      googleDriveFileSystemProvider({
        requestToken,
        getSessionList,
      }),
    );
  };

  const bindGoogleApi = async (api: GoogleApi) => {
    googleApi = api;

    await mountGoogleProvider();
  };

  const remove = async (email: string) => {
    const store = await getStore();

    await update(omit(store, [email]));
  };

  return {
    bindGoogleApi,
    requestToken,
    clear,
    sessions: defineObservable($sessions),
    remove,
  } satisfies GoogleService;
};

export const useGoogleService = createGlobalState(setupGoogleService);
