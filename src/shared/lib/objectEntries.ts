import type { Entries } from 'type-fest';

/**
 * @param v
 * @returns
 */
export const objectEntries = <O extends object>(v: O) =>
  <Entries<O>>Object.entries(v);
