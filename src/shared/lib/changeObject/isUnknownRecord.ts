import { isObject } from 'lodash-es';
import type { UnknownRecord } from 'type-fest';

export const isUnknownRecord = (v: unknown): v is UnknownRecord => isObject(v);
