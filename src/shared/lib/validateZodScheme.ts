import type { TypeOf, ZodType } from 'zod';

export const is = <Z extends ZodType>(
  value: unknown,
  zod: Z,
): value is TypeOf<Z> => zod.safeParse(value).success;

/**
 * checks value without creating a new one
 */
export const parseSelf = <Z extends ZodType>(
  value: unknown,
  zod: Z,
): TypeOf<Z> => {
  const { success, error } = zod.safeParse(value);

  if (success) {
    return value;
  }
  throw error;
};
