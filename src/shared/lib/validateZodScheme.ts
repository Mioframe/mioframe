import type { output, ZodMiniType } from 'zod/v4-mini';

export const is = <Z extends ZodMiniType>(
  value: unknown,
  zod: Z,
): value is output<Z> => zod.safeParse(value).success;

/**
 * checks value without creating a new one
 * @deprecated - use is(value, zod)
 */
export const checkSchema = <Z extends ZodMiniType>(
  value: unknown,
  zod: Z,
): output<Z> | undefined =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Here is the correct check
  is(value, zod) ? value : undefined;
