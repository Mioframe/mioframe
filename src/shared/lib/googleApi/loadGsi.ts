/// <reference types="google.accounts" />

import { limitFunction } from 'p-limit';
import type { GOOGLE_SCOPE } from './types';
import { uniq } from 'es-toolkit';

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

const resolveRequestAccess: {
  resolve: (tokenResponse: google.accounts.oauth2.TokenResponse) => unknown;
  reject: (error: google.accounts.oauth2.ClientConfigError | Error) => unknown;
}[] = [];

let stateTokenClient: google.accounts.oauth2.TokenClient | undefined;

/**
 * Авторизация в google с получением токена в отдельном окне
 */
export const requestAccessToken = limitFunction(
  async (
    clientId: string,
    scopes: GOOGLE_SCOPE[],
    { email }: { email?: string } = {},
  ) => {
    const gsi = await loadGoogle();

    return new Promise<google.accounts.oauth2.TokenResponse>(
      (resolve, reject) => {
        resolveRequestAccess.push({ resolve, reject });

        let token: google.accounts.oauth2.TokenResponse | undefined = undefined;

        if (!stateTokenClient) {
          stateTokenClient = gsi.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: uniq(scopes).join(' '),
            callback: (tokenResponse) => {
              if ('error' in tokenResponse) {
                resolveRequestAccess
                  .shift()
                  ?.reject(new Error(tokenResponse.error));
                return;
              }
              token = tokenResponse;

              resolveRequestAccess.shift()?.resolve(token);
            },
            error_callback: (error) => {
              resolveRequestAccess.shift()?.reject(error);
            },
          });
        }

        stateTokenClient.requestAccessToken({
          scope: scopes.join(' '),
          prompt: email ? '' : undefined,
          hint: email,
        });
      },
    );
  },
  {
    // строгая очерёдность вызовов что бы не перепутать токены
    concurrency: 1,
  },
);
