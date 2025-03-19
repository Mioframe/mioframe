import type { TypeOf } from 'zod';
import { record, unknown } from 'zod';
import { zodItemId } from './id';
import { zodPropertyId } from '../property';
import type { RequiredDeep } from 'type-fest';

export const zodValue = unknown();

export const zodItem = record(zodPropertyId, zodValue);

export const zodDatabaseData = record(zodItemId, zodItem);

export type Item = TypeOf<typeof zodItem>;

export type DatabaseData = RequiredDeep<TypeOf<typeof zodDatabaseData>>;
