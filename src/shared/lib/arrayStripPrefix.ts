import { arrayStartsWith } from './startsWith';

export const arrayStripPrefix = <T = unknown>(
  target: T[],
  prefix: T[],
): T[] | undefined =>
  arrayStartsWith(target, prefix) ? target.slice(prefix.length) : undefined;
