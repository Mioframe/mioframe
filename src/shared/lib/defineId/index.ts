import { string, templateLiteral, literal, minLength } from 'zod/v4-mini';
import { generateId } from '../generateId';

const ANY_ID = 'anyId' as const;

export const defineId = <P extends string = typeof ANY_ID>(
  prefix: P = ANY_ID as P,
  uidLength = 21,
) => {
  const zodId = templateLiteral([
    literal(prefix),
    string().check(minLength(1)),
  ]);

  return {
    generateId: (): `${P}${string}` => generateId(prefix, uidLength),
    zodId,
  };
};
