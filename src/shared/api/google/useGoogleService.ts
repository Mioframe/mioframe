import { createGlobalState } from '@vueuse/core';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import type { ComputedRef } from 'vue';
import { computed } from 'vue';

type GoogleService = {
  add: (token: string) => void;
  remove: () => void;
  token: ComputedRef<string | undefined>;
};

export const useGoogleService = createGlobalState((): GoogleService => {
  const { data } = useIDBKeyval<string | undefined>('google-token', undefined);

  const add = (token: string) => {
    data.value = token;
  };

  const remove = () => {
    data.value = undefined;
  };

  return {
    add,
    remove,
    token: computed(() => data.value),
  };
});
