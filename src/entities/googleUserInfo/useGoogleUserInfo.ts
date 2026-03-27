import { loadOauth2, USER_INFO_GOOGLE_SCOPE } from '@shared/lib/googleApi';
import { computedAsync } from '@vueuse/core';
import type { MaybeRef } from 'vue';
import { shallowRef, toValue } from 'vue';
import { useGoogleSessions } from './useGoogleSessions';
import ky from 'ky';
import { DomainError } from '@shared/lib/error';

export const useGoogleUserInfo = (email: MaybeRef<string>) => {
  const { requestToken } = useGoogleSessions();

  const evaluating = shallowRef(false);

  const data = computedAsync(
    async () => {
      try {
        const token = await requestToken(
          [USER_INFO_GOOGLE_SCOPE.userInfoProfile],
          toValue(email),
        );

        const oauth2 = await loadOauth2();

        const { result } = await oauth2.userinfo.get({ oauth_token: token });

        return result;
      } catch (e) {
        return new DomainError('Error retrieving user information', {
          cause: e,
        });
      }
    },
    undefined,
    {
      lazy: true,
      evaluating,
    },
  );

  const loadImage = async () => {
    if (data.value instanceof Error) {
      return data.value;
    }

    const pictureUrl = data.value?.picture;

    if (pictureUrl) {
      const response = await ky(pictureUrl, {
        method: 'get',
        referrerPolicy: 'no-referrer',
      });
      if (response.ok) {
        return URL.createObjectURL(await response.blob());
      }
    }

    return undefined;
  };

  const profileImageBlobUrl = computedAsync(() => loadImage(), undefined, {
    lazy: true,
  });

  return {
    data,
    evaluating,
    profileImageBlobUrl,
  };
};
