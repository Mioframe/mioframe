import { zodGOOGLE_SCOPE } from '@shared/lib/googleApi';
import { keys } from '@shared/lib/objectKeys';
import { ObservableIDB } from '@shared/lib/observableIDB';
import { createGlobalState } from '@vueuse/core';
import { isEqual } from 'es-toolkit';
import { distinctUntilChanged, filter, firstValueFrom, map } from 'rxjs';
import { z } from 'zod/v4-mini';

const KEY = 'google-session';

const zodSession = z.object({
  accessToken: z.string(),
  expiresAt: z.number(),
  scopes: z.array(zodGOOGLE_SCOPE),
});

const zodStore = z.catch(
  z.record(z.email(), z.catch(z.optional(zodSession), undefined)),
  {},
);

type Store = z.output<typeof zodStore>;

const setupGoogleSessionStore = () => {
  const store = new ObservableIDB(KEY, zodStore);
  const $store = store.observable().pipe(
    map((v) => v?.data),
    filter((v) => !!v),
    distinctUntilChanged((a, b) => isEqual(a, b)),
  );

  const update = async (v: Store) => store.set(v);

  const clear = async () => {
    await update({});
  };

  const getStore = () => firstValueFrom($store);

  const $sessionsList = $store.pipe(map((v) => keys(v)));

  const getSessionList = () => firstValueFrom($sessionsList);

  const get = async (email: string) => {
    const store = await getStore();
    return store[email];
  };

  return {
    update,
    clear,
    $store,
    getStore,
    getSessionList,
    get,
  };
};

export const useGoogleSessionStore = createGlobalState(setupGoogleSessionStore);
