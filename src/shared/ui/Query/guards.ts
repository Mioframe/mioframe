import { isPlainObject } from 'es-toolkit';

export const isQueryObject = (v: unknown) => isPlainObject(v);
