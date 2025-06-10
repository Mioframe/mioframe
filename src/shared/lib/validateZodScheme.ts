import type { output, ZodMiniType } from 'zod/v4-mini';

export const zodIs = <Z extends ZodMiniType>(
  value: unknown,
  zod: Z,
): value is output<Z> => zod.safeParse(value).success;

/**
 * checks value without creating a new one
 * @deprecated - use zodIs(value, zod)
 */
export const zodCheck = <Z extends ZodMiniType>(
  value: unknown,
  zod: Z,
): output<Z> | undefined => (zodIs(value, zod) ? value : undefined);

/**
 * Checking zod scheme without cloning values
 * @param value
 * @param zod
 * @returns
 */
export const zodSafeCheck = <Z extends ZodMiniType>(value: unknown, zod: Z) => {
  const { success, error } = zod.safeParse(value);

  return success
    ? {
        data: <output<Z>>value,
      }
    : {
        error,
      };
};
