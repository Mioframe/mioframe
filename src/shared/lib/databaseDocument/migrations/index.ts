import type { DatabaseTypeDocument } from '../types';
import { isInteger, isObjectLike } from '@shared/lib/typeGuards';
import { applyMigrationsBody } from './applyMigrations';

export const migrateDatabaseBody = (body: object) => {
  const version: number =
    'version' in body ? (isInteger(body.version) ? body.version : 0) : 0;

  return applyMigrationsBody(body, version);
};

export const migrateDatabaseDocument = (data: DatabaseTypeDocument) => {
  if (!isObjectLike(data.body)) {
    data.body = {};
  }

  const body = data.body as object;

  return migrateDatabaseBody(body);
};
