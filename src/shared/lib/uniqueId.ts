import { useSessionStorage } from '@vueuse/core';

const idCounter = useSessionStorage('idCounter', 0);

export type UniqueId<S extends string> = `${S}${number}`;

export const uniqueId = <S extends string>(prefix: S): UniqueId<S> => {
  if (idCounter.value >= 1e6) {
    idCounter.value = 0;
  }

  const id = idCounter.value + 1;
  idCounter.value = id;
  return `${prefix}${id}`;
};
