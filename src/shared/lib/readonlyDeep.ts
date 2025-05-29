import type { ReadonlyDeep } from 'type-fest';

export const defineReadonlyDeep = <T>(v: T) => <ReadonlyDeep<T>>v;
