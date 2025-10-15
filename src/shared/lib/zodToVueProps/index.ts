import type { z } from 'zod/v4-mini';

type OptionalKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? K : never;
}[keyof T];

type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

type MandateOptionalWithUndefined<T> = {
  [K in RequiredKeys<T>]: T[K];
} & {
  [K in OptionalKeys<T>]-?: NonNullable<T[K]> | undefined;
};

export const zodToVueProps = <
  Z extends z.ZodMiniObject,
  T extends MandateOptionalWithUndefined<z.output<Z>>,
>(
  zod: Z,
) =>
  Object.keys(zod.def.shape) as {
    [K in keyof T]: {
      required: Extract<T[K], undefined> extends never ? true : false;
      type: () => T[K];
    };
  };
