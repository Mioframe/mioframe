import { isInteger as isIntegerOriginal } from 'es-toolkit/compat';

export const isInteger = (v?: unknown): v is number => isIntegerOriginal(v);
