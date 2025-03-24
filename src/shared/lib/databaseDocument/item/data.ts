import type { TypeOf } from 'zod';
import { record, unknown } from 'zod';
import { zodItemId } from './id';
import { zodPropertyId } from '../property';

export const zodDatabaseValue = unknown();

export type DatabaseValue = TypeOf<typeof zodDatabaseValue>;

export const zodDatabaseItem = record(zodPropertyId, zodDatabaseValue);

export type DatabaseItem = TypeOf<typeof zodDatabaseItem>;

export const zodDatabaseData = record(zodItemId, zodDatabaseItem);

export type DatabaseData = TypeOf<typeof zodDatabaseData>;
