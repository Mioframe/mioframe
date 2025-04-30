import type { Entries } from 'type-fest';

export const objectEntries = <O extends object>(v: O) =>
  <Entries<O>>Object.entries(v);
