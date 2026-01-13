import { loadOauth2 } from '@shared/lib/googleApi';
import { asyncComputed, computedAsync } from '@vueuse/core';
import { shallowRef } from 'vue';
import { useGSession } from './useGSession';
import ky from 'ky';
import { DomainError } from '@shared/lib/error';

export const useGProfile = () => {
  const { accessToken } = useGSession();

  const userInfoEvaluating = shallowRef(false);

  const userInfo = computedAsync(
    async () => {
      const token = accessToken.value;

      if (!token) {
        return undefined;
      }

      try {
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
      evaluating: userInfoEvaluating,
    },
  );

  const loadImage = async () => {
    if (userInfo.value instanceof Error) {
      return userInfo.value;
    }

    const pictureUrl = userInfo.value?.picture;

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

  const profileImageBlobUrl = asyncComputed(() => loadImage(), undefined, {
    lazy: true,
  });

  return {
    userInfo,
    evaluating: userInfoEvaluating,
    profileImageBlobUrl,
  };
};
