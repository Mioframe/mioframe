import { enum as zodEnum } from 'zod/v4-mini';
import { is } from '../validateZodScheme';

type EnumValue = string | number;
type EnumLike = Readonly<Record<string, EnumValue>>;

export const isEnumValue = <E extends EnumLike>(
  value: unknown,
  enumLike: E,
): value is E[keyof E] => is(value, zodEnum(enumLike));
