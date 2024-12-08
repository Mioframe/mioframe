import { type TypeOf, type ZodType } from 'zod';

export const is = <Z extends ZodType>(
  value: unknown,
  zod: Z,
): value is TypeOf<Z> => zod.safeParse(value).success;

/**
 * checks value without creating a new one
 */
export function checkSchema<Z extends ZodType, T>(
  value: T,
  zod: Z,
): T extends TypeOf<Z> ? T : TypeOf<Z> | undefined;
export function checkSchema<Z extends ZodType>(value: unknown, zod: Z) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- method "is" checked the type
  return is(value, zod) ? value : undefined;
}
