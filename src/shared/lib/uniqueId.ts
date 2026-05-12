import { useSessionStorage } from '@vueuse/core';

const idCounterStorage = useSessionStorage<Record<string, string>>(
  'idCounter',
  {},
  {
    mergeDefaults: true,
  },
);

export type UniqueId<S extends string> = `${S}${string}`;

const radix = 36;

export const sessionUniqueId = <S extends string>(prefix: S): UniqueId<S> => {
  let currentCount = parseInt(idCounterStorage.value[prefix] ?? '0', radix);

  if (currentCount >= Number.MAX_SAFE_INTEGER) {
    currentCount = 0;
  }

  idCounterStorage.value[prefix] = (currentCount + 1).toString(radix);

  return `${prefix}${idCounterStorage.value[prefix]}`;
};
