import {
  loadOauth2,
  type GOOGLE_SCOPE,
  requestAccessToken,
  revokeGoogleAccess,
} from '@shared/lib/googleApi';
import { useMainServiceClient } from '@shared/service';
import type { GoogleApi } from '@shared/service';

type UserinfoGet = (request: {
  oauth_token?: string | undefined;
}) => Promise<Awaited<ReturnType<gapi.client.oauth2.UserinfoResource['get']>>>;

const createGoogleApi = (clientId: string): GoogleApi => {
  const userinfoGet: UserinfoGet = (request): ReturnType<UserinfoGet> =>
    loadOauth2().then((oauth2) =>
      oauth2.userinfo.get(request.oauth_token ? { oauth_token: request.oauth_token } : {}),
    );

  return {
    requestAccessToken: (scopes: GOOGLE_SCOPE[], email?: string) =>
      requestAccessToken(clientId, scopes, email ? { email } : {}),
    userinfoGet,
    revoke: revokeGoogleAccess,
  };
};

/**
 * Binds the lazy Google auth API implementation to the shared Google service.
 * @param clientId - Google OAuth client ID used for future user-initiated auth flows.
 */
export const setupGoogleSessions = async (clientId: string): Promise<void> => {
  const {
    google: { bindGoogleApi },
  } = useMainServiceClient();

  await bindGoogleApi(createGoogleApi(clientId));
};
