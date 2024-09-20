import { uid } from 'uid/secure';
import { string, custom } from 'zod';

const ANY_ID = 'anyId';

export const defineId = <P extends string = typeof ANY_ID>(
  prefix: P = ANY_ID as P,
  uidLength = 21,
) => {
  const generateId = (): `${P}${string}` => `${prefix}${uid(uidLength)}`;

  const zodId = custom<`${P}${string}`>(
    (data) =>
      string()
        .startsWith(prefix)
        .length(prefix.length + uidLength)
        .safeParse(data).success,
  );

  return {
    generateId,
    zodId,
  };
};
