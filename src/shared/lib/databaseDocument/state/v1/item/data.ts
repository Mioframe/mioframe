import { record, unknown } from '@zod/mini';
import { zodItemId } from './id';
import { zodPropertyId } from '../property';
import { zodOnlyRecord } from '@shared/lib/zodRecord';

export const zodDatabaseValue = unknown();

export const zodDatabaseItem = record(zodPropertyId, zodDatabaseValue);

export const zodDatabaseData = zodOnlyRecord(zodItemId, zodDatabaseItem);
