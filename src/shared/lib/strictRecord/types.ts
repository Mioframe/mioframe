import type { EmptyObject } from 'type-fest';

export type StrictRecord<K extends string, T> = Record<K, T | undefined> &
  EmptyObject;
