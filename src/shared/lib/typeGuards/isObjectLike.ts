import { isObjectLike as isObjectLikeOriginal } from 'es-toolkit/compat';

export const isObjectLike = (v?: unknown): v is object =>
  isObjectLikeOriginal(v);
