import type { output, ZodMiniType } from '@zod/mini';

export const is = <Z extends ZodMiniType>(
  value: unknown,
  zod: Z,
): value is output<Z> => zod.safeParse(value).success;

/**
 * checks value without creating a new one
 */
export function checkSchema<Z extends ZodMiniType, T>(
  value: T,
  zod: Z,
): T extends output<Z> ? T : output<Z> | undefined;
export function checkSchema<Z extends ZodMiniType>(value: unknown, zod: Z) {
  return is(value, zod) ? value : undefined;
}
