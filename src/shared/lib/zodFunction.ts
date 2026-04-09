import type { core, output } from 'zod/v4-mini';
import { custom } from 'zod/v4-mini';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- for interface
export type AnyFunction = (...p: any[]) => any;

export const zodFunction = <
  I extends core.$ZodTuple | undefined = undefined,
  O extends core.$ZodType = core.$ZodVoid,
>(
  _?: {
    input?: I;
    output?: O;
  },
) =>
  custom<(...input: I extends core.$ZodTuple ? output<I> : undefined[]) => output<O>>(
    (val): val is AnyFunction => typeof val === 'function',
  );
