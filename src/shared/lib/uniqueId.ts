import { ref } from 'vue';
import { useSessionStorage } from '@vueuse/core';

type IdCounterStorage = {
  value: Record<string, string>;
};

const inMemoryIdCounterStorage = ref<Record<string, string>>({});

let idCounterStorage: IdCounterStorage | undefined;

/**
 * String identifier shape returned by {@link sessionUniqueId}.
 */
export type UniqueId<S extends string> = `${S}${string}`;

const radix = 36;

function getIdCounterStorage(): IdCounterStorage {
  if (idCounterStorage) {
    return idCounterStorage;
  }

  try {
    idCounterStorage = useSessionStorage<Record<string, string>>(
      'idCounter',
      {},
      {
        mergeDefaults: true,
      },
    );
  } catch {
    // Storybook and similar isolated runtimes should not fail at import time if storage wiring changes.
    idCounterStorage = inMemoryIdCounterStorage;
  }

  return idCounterStorage;
}

/**
 * Returns a stable per-session identifier with a prefix-specific counter.
 * @param prefix - Stable prefix for the generated identifier family.
 * @returns Session-scoped identifier string with the provided prefix.
 */
export const sessionUniqueId = <S extends string>(prefix: S): UniqueId<S> => {
  const storage = getIdCounterStorage();
  let currentCount = parseInt(storage.value[prefix] ?? '0', radix);

  if (currentCount >= Number.MAX_SAFE_INTEGER) {
    currentCount = 0;
  }

  storage.value[prefix] = (currentCount + 1).toString(radix);

  return `${prefix}${storage.value[prefix]}`;
};
