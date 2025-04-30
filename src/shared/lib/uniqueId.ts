let idCounter = 0;

export const uniqueId = <S extends string>(prefix: S): `${S}${number}` => {
  const id = ++idCounter;
  return `${prefix}${id}`;
};
