import type { PropType } from 'vue';
import type { z } from 'zod/mini';
import { safeParse } from 'zod/mini';
import { objectEntries } from '../objectEntries';

type OptionalKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? K : never;
}[keyof T];

type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

type MandateOptionalWithUndefined<T> = {
  [K in RequiredKeys<T>]: T[K];
} & {
  [K in OptionalKeys<T>]-?: NonNullable<T[K]> | undefined;
};

/**
 * Converts a Zod schema object to Vue props definition
 *
 * This utility function takes a Zod schema and converts it to a Vue props definition
 * that can be used with defineProps. It maps the schema fields to Vue prop definitions
 * with proper required/optional flags and type information for Vue's type system.
 *
 * Note: The function returns a minimal type assertion that Vue can properly type-check
 * during component compilation, rather than the full Zod schema structure.
 * @param zod - The Zod schema object to convert
 * @returns Vue props definition object for use with defineProps
 */
export const zodToVueProps = <
  Z extends z.ZodMiniObject,
  T extends MandateOptionalWithUndefined<z.output<Z>>,
>(
  zod: Z,
): {
  [K in keyof T]: {
    required: Extract<T[K], undefined> extends never ? true : false;
    type: PropType<T[K]>;
  };
} => {
  const props = objectEntries(zod.shape).map(([key, value]) => [
    key,
    {
      required: !safeParse(value, undefined).success,
      type: null,
    },
  ]);

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Vue cannot infer prop types from Zod schemas at runtime
  return Object.fromEntries(props) as {
    [K in keyof T]: {
      required: Extract<T[K], undefined> extends never ? true : false;
      type: PropType<T[K]>;
    };
  };
};
