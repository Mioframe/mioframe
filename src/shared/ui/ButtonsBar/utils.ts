import type { ButtonDescription } from './types';

export const defineBarButtons = <T extends Iterable<ButtonDescription>>(
  v: T,
): T => v;
