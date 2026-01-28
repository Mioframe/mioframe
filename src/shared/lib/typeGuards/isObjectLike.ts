import { isObjectLike as isObjectLikeOriginal } from 'es-toolkit/compat';
import type { UnknownArray, UnknownRecord } from 'type-fest';

export const isObjectLike = (v?: unknown): v is UnknownRecord | UnknownArray =>
  isObjectLikeOriginal(v);
