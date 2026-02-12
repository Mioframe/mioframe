import { useMainServiceClient } from '@shared/service';
import { DomainError } from '@shared/lib/error';
import {
  requestAccessToken,
  loadGoogle,
  loadOauth2,
} from '@shared/lib/googleApi';
import type { GOOGLE_SCOPE } from '@shared/lib/googleApi/types';
import { USER_INFO_GOOGLE_SCOPE } from '@shared/lib/googleApi/types';
import { useSubscribeByQueryClient } from '@shared/lib/subscriptions';
import { uniq } from 'es-toolkit';
import { readonly, computed } from 'vue';

export const useGSession = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const {
    google: { addSession, removeSession, subscribeGetToken, subscribeGetScope },
  } = useMainServiceClient();

  const getToken = useSubscribeByQueryClient(subscribeGetToken);

  const getScope = useSubscribeByQueryClient(subscribeGetScope);

  const accessToken = computed(() => getToken());

  const scope = computed(() => getScope());

  const login = async (...scopes: GOOGLE_SCOPE[]) => {
    if (!clientId) {
      throw new DomainError("don't have client id for google api");
    }
    const tokenResponse = await requestAccessToken(
      clientId,
      uniq([USER_INFO_GOOGLE_SCOPE.userInfoProfile, ...scopes]),
    );

    const oauth2 = await loadOauth2();

    const {
      result: { email },
    } = await oauth2.userinfo.get({ oauth_token: tokenResponse.access_token });

    await addSession({ tokenResponse, email });
  };

  const revoke = async () => {
    const google = await loadGoogle();

    const token = accessToken.value;

    if (token) {
      return new Promise<void>((resolve) => {
        google.accounts.oauth2.revoke(token, resolve);
      });
    }
  };

  const logout = async () => {
    await removeSession();
  };

  // fixme: добавить проверку актуальности токена

  return {
    login,
    logout,
    revoke,
    accessToken: readonly(accessToken),
    scope,
  };
};
