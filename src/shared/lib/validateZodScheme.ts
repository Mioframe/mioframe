import type { TypeOf, ZodType } from 'zod';

export const is = <T, Z extends ZodType>(
  value: T,
  zod: Z,
): value is TypeOf<Z> => zod.safeParse(value).success;

/**
 * checks value without creating a new one
 */
export const parseSelf = <V, Z extends ZodType>(
  value: V,
  zod: Z,
): TypeOf<Z> => {
  const { success, error } = zod.safeParse(value);
  if (success) {
    return value;
  }
  throw error;
};
