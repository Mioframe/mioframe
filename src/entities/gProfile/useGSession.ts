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
import { readonly, computed } from 'vue';
import { GOOGLE_CLIENT_ID } from '@shared/config';

type UserinfoGetReturn = Awaited<
  ReturnType<gapi.client.oauth2.UserinfoResource['get']>
>;

type UserinfoGet = (
  ...args: Parameters<gapi.client.oauth2.UserinfoResource['get']>
) => Promise<UserinfoGetReturn>;

export const setupGoogleSessions = (clientId: string) => {
  const {
    google: { bindGoogleApi },
  } = useMainServiceClient();

  const userinfoGet: UserinfoGet = (
    ...args: Parameters<UserinfoGet>
  ): ReturnType<UserinfoGet> =>
    loadOauth2().then((oauth2) => oauth2.userinfo.get(...args));

  void bindGoogleApi({
    requestAccessToken: (scopes: GOOGLE_SCOPE[], email?: string) =>
      requestAccessToken(clientId, scopes, { email }),
    userinfoGet,
  });
};

// todo: переделать на простой клиент получения токена, список авторизованных сессий и очистку сессий
export const useGSession = () => {
  const clientId = GOOGLE_CLIENT_ID;

  const {
    google: {
      requestToken,
      // TODO: добавить методы управления сессиями
    },
  } = useMainServiceClient();

  const getScope = useSubscribeByQueryClient(subscribeGetScope);

  const scope = computed(() => getScope());

  const login = async () => {
    if (!clientId) {
      throw new DomainError("don't have client id for google api");
    }

    const token = await requestToken([USER_INFO_GOOGLE_SCOPE.userInfoProfile]);

    const oauth2 = await loadOauth2();

    const {
      result: { email },
    } = await oauth2.userinfo.get({ oauth_token: token });

    await addSession({ tokenResponse: token, email });
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

  return {
    login,
    logout,
    revoke,
    accessToken: readonly(accessToken),
    scope,
  };
};
