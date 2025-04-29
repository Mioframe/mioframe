import { record, unknown } from '@zod/mini';
import { zodItemId } from './id';
import { zodPropertyId } from '../property';

export const zodDatabaseValue = unknown();

export const zodDatabaseItem = record(zodPropertyId, zodDatabaseValue);

export const zodDatabaseData = record(zodItemId, zodDatabaseItem);
