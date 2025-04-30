import { isObjectType } from 'remeda';
import type { UnknownRecord } from 'type-fest';

export const isUnknownRecord = (v: unknown): v is UnknownRecord =>
  isObjectType(v);
