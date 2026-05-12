import { useSessionStorage } from '@vueuse/core';
const idCounterStorage = useSessionStorage<Record<string, string>>(
  'idCounter',
  {},
  {
    mergeDefaults: true,
  },
);

const radix = 36;

/**
 * String identifier shape returned by {@link sessionUniqueId}.
 */
export type UniqueId<S extends string> = `${S}${string}`;

/**
 * Returns a stable per-session identifier with a prefix-specific counter.
 * @param prefix - Stable prefix for the generated identifier family.
 * @returns Session-scoped identifier string with the provided prefix.
 */
export const sessionUniqueId = <S extends string>(prefix: S): UniqueId<S> => {
  let currentCount = parseInt(idCounterStorage.value[prefix] ?? '0', radix);

  if (currentCount >= Number.MAX_SAFE_INTEGER) {
    currentCount = 0;
  }

  idCounterStorage.value[prefix] = (currentCount + 1).toString(radix);

  return `${prefix}${idCounterStorage.value[prefix]}`;
};
