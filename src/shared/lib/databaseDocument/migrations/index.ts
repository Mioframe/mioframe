import type { DatabaseTypeDocument } from '../types';
import { isInteger, isObjectLike } from '@shared/lib/typeGuards';
import { databaseBodyMigrations } from './bodyMigrations';
import type { UnknownRecord } from 'type-fest';

export const applyMigrateDatabaseBody = (body: object) => {
  const version: number = 'version' in body ? (isInteger(body.version) ? body.version : 0) : 0;

  return databaseBodyMigrations.applyUpdate(body, version);
};

export const applyMigrateDatabaseDocument = (data: DatabaseTypeDocument) => {
  if (!isObjectLike(data.body)) {
    data.body = {};
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- we want to be able to modify the body, so we need it to be a mutable type
  const body = data.body as UnknownRecord;

  return applyMigrateDatabaseBody(body);
};
