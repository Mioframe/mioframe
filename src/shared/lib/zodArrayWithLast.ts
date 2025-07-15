import { array, minLength, type ZodMiniType } from 'zod/v4-mini';

export const zodArrayWithLast = <E, L>(
  elementSchema: ZodMiniType<E>,
  lastSchema: ZodMiniType<L>,
): ZodMiniType<[...E[], L]> =>
  array(elementSchema).check(minLength(1), (ctx) => {
    const arr = ctx.value;

    const last = arr.at(-1);
    const res = lastSchema.safeParse(last);
    if (!res.success) {
      for (const issue of res.error.issues) {
        ctx.issues.push({
          ...issue,
        });
      }
    }
  }) as unknown as ZodMiniType<[...E[], L]>;
