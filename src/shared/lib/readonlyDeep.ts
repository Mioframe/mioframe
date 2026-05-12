import type { ReadonlyDeep } from 'type-fest';

/**
 * Type assertion utility to mark an object as deeply readonly.
 * @warning This does NOT create a readonly copy - it only casts the type.
 * Use for type narrowing when you know the object is already immutable.
 * @param v - Value to cast as deeply readonly
 * @returns The same value with ReadonlyDeep<T> type
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- readonly type cast utility
export const defineReadonlyDeep = <T>(v: T) => <ReadonlyDeep<T>>v;
