import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DRIVE_GOOGLE_SCOPE } from './types';

const initTokenClientMock = vi.fn();
const requestAccessTokenMock = vi.fn();

describe('requestAccessToken', () => {
  beforeEach(() => {
    vi.resetModules();
    initTokenClientMock.mockReset();
    requestAccessTokenMock.mockReset();
    initTokenClientMock.mockReturnValue({
      requestAccessToken: requestAccessTokenMock,
    });

    Object.defineProperty(window, 'google', {
      configurable: true,
      value: {
        accounts: {
          id: {},
          oauth2: {
            initTokenClient: initTokenClientMock,
          },
        },
      },
    });
  });

  it('passes login_hint to the GIS token request override config', async () => {
    let appendedScriptEl: HTMLScriptElement | undefined;
    const appendSpy = vi.spyOn(document.body, 'append').mockImplementation((...nodes) => {
      const [firstNode] = nodes;
      if (firstNode instanceof HTMLScriptElement) {
        appendedScriptEl = firstNode;
      }
    });

    const { requestAccessToken } = await import('./loadGsi');

    try {
      const tokenPromise = requestAccessToken('client-id', [DRIVE_GOOGLE_SCOPE.all], {
        email: 'user@example.com',
      });

      await Promise.resolve();

      expect(appendedScriptEl?.src).toBe('https://accounts.google.com/gsi/client');

      appendedScriptEl?.onload?.(new Event('load'));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(initTokenClientMock).toHaveBeenCalledTimes(1);
      expect(requestAccessTokenMock).toHaveBeenCalledWith({
        login_hint: 'user@example.com',
        prompt: '',
        scope: DRIVE_GOOGLE_SCOPE.all,
      });

      const [initTokenClientConfig] = initTokenClientMock.mock.calls[0] ?? [];
      expect(initTokenClientConfig).toBeDefined();
      if (!initTokenClientConfig) {
        throw new Error('Missing token client config');
      }

      const tokenResponse = {
        access_token: 'token',
        error: '',
        error_description: '',
        error_uri: '',
        expires_in: '3600',
        hd: '',
        prompt: '',
        scope: DRIVE_GOOGLE_SCOPE.all,
        state: '',
        token_type: 'Bearer',
      };

      Reflect.deleteProperty(tokenResponse, 'error');
      Reflect.deleteProperty(tokenResponse, 'error_description');
      Reflect.deleteProperty(tokenResponse, 'error_uri');

      initTokenClientConfig.callback(tokenResponse);

      await expect(tokenPromise).resolves.toMatchObject({
        access_token: 'token',
      });
    } finally {
      appendSpy.mockRestore();
    }
  });
});
