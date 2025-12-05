import {
  zodGOOGLE_SCOPE,
  type GOOGLE_SCOPE,
} from '@shared/lib/googleApi/types';
import type { SubscribeByQueryService } from '@shared/lib/subscriptions';
import { defineSubscribeByQueryService } from '@shared/lib/subscriptions';
import { zodIs } from '@shared/lib/validateZodScheme';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';

type TokenResponse = google.accounts.oauth2.TokenResponse;

type GoogleSessionService = {
  addSession: (state: GoogleSessionState) => void;
  removeSession: () => void;
  getToken: () => string | undefined;
  subscribeGetToken: SubscribeByQueryService<[], string | undefined>;
  getScopes: () => Set<GOOGLE_SCOPE>;
  subscribeGetScope: SubscribeByQueryService<[], Set<GOOGLE_SCOPE>>;
};

type GoogleSessionState = {
  tokenResponse: TokenResponse;
  email?: string;
};

export const setupGoogleSessionService = (): GoogleSessionService => {
  const { data } = useIDBKeyval<GoogleSessionState | undefined>(
    'google-session',
    undefined,
  );

  const addSession = (state: GoogleSessionState) => {
    data.value = state;
  };

  const removeSession = () => {
    data.value = undefined;
  };

  // todo: повторять тихую авторизацию при протухании
  const getToken = () => data.value?.tokenResponse.access_token;

  const subscribeGetToken = defineSubscribeByQueryService(getToken);

  const getScopes = (): Set<GOOGLE_SCOPE> => {
    const scope = data.value?.tokenResponse.scope
      .split(' ')
      .filter((v) => zodIs(v, zodGOOGLE_SCOPE));
    return new Set(scope);
  };

  const subscribeGetScope = defineSubscribeByQueryService(getScopes);

  return {
    addSession,
    removeSession,

    getToken,
    subscribeGetToken,

    getScopes,
    subscribeGetScope,
  };
};
