import {
  loadOauth2,
  type GOOGLE_SCOPE,
  requestAccessToken,
  revokeGoogleAccess,
} from '@shared/lib/googleApi';
import { useMainServiceClient } from '@shared/service';
import type { UserinfoGet } from './useGoogleSessions';

export const setupGoogleSessions = (clientId: string) => {
  const {
    google: { bindGoogleApi },
  } = useMainServiceClient();

  const userinfoGet: UserinfoGet = (...args: Parameters<UserinfoGet>): ReturnType<UserinfoGet> =>
    loadOauth2().then((oauth2) => oauth2.userinfo.get(...args));

  void bindGoogleApi({
    requestAccessToken: (scopes: GOOGLE_SCOPE[], email?: string) =>
      requestAccessToken(clientId, scopes, { email }),
    userinfoGet,
    revoke: revokeGoogleAccess,
  });
};
