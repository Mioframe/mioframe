import { uid } from 'uid/secure';
import { string, length, templateLiteral, literal } from 'zod/v4-mini';

const ANY_ID = 'anyId';

export const defineId = <P extends string = typeof ANY_ID>(
  prefix: P = ANY_ID as P,
  uidLength = 21,
) => {
  const generateId = (): `${P}${string}` => `${prefix}${uid(uidLength)}`;

  const zodId = templateLiteral([
    literal(prefix),
    string().check(length(uidLength)),
  ]);

  return {
    generateId,
    zodId,
  };
};
