import { record, unknown } from 'zod/v4-mini';
import { zodItemId } from './id';
import { zodPropertyId } from '../property';
import { zodStrictRecord } from '@shared/lib/strictRecord/zodStrictRecord';

export const zodDatabaseValue = unknown();

export const zodDatabaseItem = record(zodPropertyId, zodDatabaseValue);

export const zodDatabaseData = zodStrictRecord(zodItemId, zodDatabaseItem);
