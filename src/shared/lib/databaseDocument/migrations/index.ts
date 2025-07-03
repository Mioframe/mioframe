import type { DatabaseTypeDocument } from '../types';
import { isInteger, isObjectLike } from '@shared/lib/typeGuards';
import { databaseBodyMigrations } from './bodyMigrations';

export const applyMigrateDatabaseBody = (body: object) => {
  const version: number =
    'version' in body ? (isInteger(body.version) ? body.version : 0) : 0;

  return databaseBodyMigrations.applyUpdate(body, version);
};

export const applyMigrateDatabaseDocument = (data: DatabaseTypeDocument) => {
  if (!isObjectLike(data.body)) {
    data.body = {};
  }

  const body = data.body as object;

  return applyMigrateDatabaseBody(body);
};
