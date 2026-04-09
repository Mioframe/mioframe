import type { output, ZodMiniType } from 'zod/mini';

export const zodIs = <Z extends ZodMiniType>(value: unknown, zod: Z): value is output<Z> =>
  zod.safeParse(value).success;

export const zodCheck = <Z extends ZodMiniType>(
  zod: Z,
  value: unknown,
  { throwAnError = false } = {},
): value is output<Z> => {
  const { success, error } = zod.safeParse(value);
  if (throwAnError && !success) {
    throw error;
  }
  return success;
};

/**
 * Checking zod scheme without cloning values
 * @param value
 * @param zod
 * @returns
 */
export const zodSafeCheck = <Z extends ZodMiniType>(zod: Z, value: unknown) => {
  const { success, error } = zod.safeParse(value);

  return success
    ? {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- zod validated value narrowing
        data: <output<Z>>value,
      }
    : {
        error,
      };
};
