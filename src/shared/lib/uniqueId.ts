let idCounter = 0;

export type UniqueId<S extends string> = `${S}${number}`;

export const uniqueId = <S extends string>(prefix: S): UniqueId<S> => {
  const id = ++idCounter;
  return `${prefix}${id}`;
};
