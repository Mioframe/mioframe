import { createLogger } from '../logger';

const { debug } = createLogger('getGsi');

let gsi: undefined | typeof google;

const getGsi = async () => {
  debug('getGsi');
  if (gsi) {
    return gsi;
  }
  const gsiUrl = 'https://accounts.google.com/gsi/client';

  const scriptEl = document.createElement('script');

  scriptEl.async = true;
  scriptEl.defer = true;
  scriptEl.src = gsiUrl;

  return new Promise<typeof google>((resolve) => {
    scriptEl.onload = () => {
      gsi = google;
      resolve(gsi);
    };

    document.body.append(scriptEl);
  });
};

let tokenClient: undefined | google.accounts.oauth2.TokenClient;

let stateToken: google.accounts.oauth2.TokenResponse | undefined;

const resolveRequestAccess: {
  resolve: (tokenResponse: google.accounts.oauth2.TokenResponse) => unknown;
  reject: (error: google.accounts.oauth2.ClientConfigError) => unknown;
}[] = [];

export const requestAccess = async (clientId: string, scopes: string[]) => {
  debug('requestAccess');
  const gsi = await getGsi();

  return new Promise<google.accounts.oauth2.TokenResponse>(
    (resolve, reject) => {
      resolveRequestAccess.push({ resolve, reject });

      if (!tokenClient) {
        debug('requestAccess', 'initTokenClient');
        tokenClient = gsi.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: scopes.join(' '),
          callback: (tokenResponse) => {
            stateToken = tokenResponse;
            resolveRequestAccess.shift()?.resolve(tokenResponse);
          },
          error_callback: (error) => {
            resolveRequestAccess.shift()?.reject(error);
          },
        });
        tokenClient.requestAccessToken();
      } else {
        debug('requestAccess', 'requestAccessToken');
        tokenClient.requestAccessToken({
          scope: scopes.join(' '),
        });
      }
    },
  );
};

const checkAccess = async (scopes: [string, ...string[]]) => {
  debug('checkAccess');
  const gsi = await getGsi();

  return (
    stateToken && gsi.accounts.oauth2.hasGrantedAllScopes(stateToken, ...scopes)
  );
};

export const checkAndRequestAccess = async (
  clientId: string,
  scopes: [string, ...string[]],
) => {
  debug('checkAndRequestAccess');
  const hasAccess = await checkAccess(scopes);
  if (hasAccess) {
    return hasAccess;
  } else {
    await requestAccess(clientId, scopes);
    return checkAccess(scopes);
  }
};
