import type { core, output } from '@zod/mini';
import { custom } from '@zod/mini';

export const zodFunction = <
  I extends core.$ZodTuple | undefined = undefined,
  O extends core.$ZodType = core.$ZodVoid,
>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- no need for runtime type checking
  _?: {
    input?: I;
    output?: O;
  },
) =>
  custom<
    (...input: I extends core.$ZodTuple ? output<I> : undefined[]) => output<O>
  >((val) => typeof val === 'function');
