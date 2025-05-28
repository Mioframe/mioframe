import { isObjectLike } from 'es-toolkit/compat';
import type { UnknownRecord } from 'type-fest';

export const isUnknownRecord = (v: unknown): v is UnknownRecord =>
  isObjectLike(v);
