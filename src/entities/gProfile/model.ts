import { useGoogleApi } from '@shared/lib/googleApi/useGoogleApi';
import { createLogger } from '@shared/lib/logger';
import { computed, watchEffect } from 'vue';

const { debug } = createLogger('GProfileCard model');

export const useGProfile = () => {
  const googleApi = useGoogleApi();

  const profile = computed(() => googleApi.userInfo);

  watchEffect(() => {
    debug('profile', profile.value);
  });

  return {
    remove: googleApi.removeToken,
    profile,
  };
};
