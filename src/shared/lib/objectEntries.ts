import type { Entries as SimpleEntries } from 'type-fest';
import type { StrictRecord } from './strictRecord';

/**
 * @param v
 * @returns
 */
export const objectEntries = <O extends object>(v: O) =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- type-safe Object.entries wrapper
  <SimpleEntries<O>>Object.entries(v);

export const recordEntries = <O extends Record<PropertyKey, unknown>>(v: O) =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- type-safe Object.entries wrapper
  <RecordEntries<O>>Object.entries(v);

export type RecordEntries<T> =
  T extends StrictRecord<infer Allowed, infer Value>
    ? { [P in Allowed]: [P, Exclude<Value, undefined>] }[Allowed][]
    : T extends Record<PropertyKey, unknown>
      ? SimpleEntries<T>
      : never;
