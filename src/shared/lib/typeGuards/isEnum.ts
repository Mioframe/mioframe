import type { EnumLike } from 'zod';
import { nativeEnum } from 'zod';
import { is } from '../validateZodScheme';

export const isEnumValue = <E extends EnumLike>(
  value: unknown,
  enumLike: E,
): value is E[keyof E] => is(value, nativeEnum(enumLike));
