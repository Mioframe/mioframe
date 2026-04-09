/// <reference types="google.accounts" />

import { limitFunction } from 'p-limit';
import type { GOOGLE_SCOPE } from './types';
import { uniq } from 'es-toolkit';
import { zodIs } from '@shared/lib/validateZodScheme';
import { GoogleClientConfigError, zodGoogleClientConfigError } from './googleClientConfigError';

let gsi: typeof window.google | undefined = undefined;

export const loadGsi = async () =>
  new Promise<typeof window.google>((resolve) => {
    if (gsi) {
      resolve(gsi);
      return;
    }
    const gsiUrl = 'https://accounts.google.com/gsi/client';

    const scriptEl = document.createElement('script');

    scriptEl.async = true;
    scriptEl.defer = true;
    scriptEl.src = gsiUrl;

    scriptEl.onload = () => {
      gsi = window.google;
      resolve(gsi);
    };

    document.body.append(scriptEl);
  });

export const loadGoogle = loadGsi;

export const revokeGoogleAccess = async (accessToken: string) => {
  const google = await loadGoogle();

  return new Promise<void>((resolve, reject) => {
    try {
      google.accounts.oauth2.revoke(accessToken, () => {
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
};

const resolveRequestAccess: {
  resolve: (tokenResponse: google.accounts.oauth2.TokenResponse) => unknown;
  reject: (error: GoogleClientConfigError | Error) => unknown;
}[] = [];

let stateTokenClient: google.accounts.oauth2.TokenClient | undefined;

/**
 * Авторизация в google с получением токена в отдельном окне
 */
export const requestAccessToken = limitFunction(
  async (clientId: string, scopes: GOOGLE_SCOPE[], { email }: { email?: string } = {}) => {
    const gsi = await loadGoogle();

    return new Promise<google.accounts.oauth2.TokenResponse>((resolve, reject) => {
      resolveRequestAccess.push({ resolve, reject });

      let token: google.accounts.oauth2.TokenResponse | undefined = undefined;

      if (!stateTokenClient) {
        try {
          stateTokenClient = gsi.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: uniq(scopes).join(' '),
            callback: (tokenResponse) => {
              if ('error' in tokenResponse) {
                resolveRequestAccess.shift()?.reject(new Error(tokenResponse.error));
                return;
              }
              token = tokenResponse;

              resolveRequestAccess.shift()?.resolve(token);
            },
            error_callback: (error) => {
              resolveRequestAccess.shift()?.reject(new GoogleClientConfigError(error));
            },
          });
        } catch (error) {
          resolveRequestAccess
            .shift()
            ?.reject(
              zodIs(error, zodGoogleClientConfigError)
                ? new GoogleClientConfigError(error)
                : error instanceof Error
                  ? error
                  : new Error('Failed to initialize Google token client'),
            );
          return;
        }
      }

      stateTokenClient.requestAccessToken({
        scope: scopes.join(' '),
        prompt: email ? '' : undefined,
        hint: email,
      });
    });
  },
  {
    // строгая очерёдность вызовов что бы не перепутать токены
    concurrency: 1,
  },
);
