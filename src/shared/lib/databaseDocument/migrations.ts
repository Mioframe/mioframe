import { putObject } from '../changeObject';
import type { CRDocument } from '../documentApi';
import type { DataBaseStateV1 } from './types';

export const initialDatabaseStateV1 = (): DataBaseStateV1 => ({
  version: 1,
  properties: {},
  data: {},
});

/**
 * Миграция должна проверять текущую версию документа
 * Запускать последжовательные миграции начиная с нужной версии до конца
 */
export const migrationsMap: {
  [CURRENT_VERSION: number]: <D extends CRDocument>(doc: D) => void;
} = {
  0: (doc: CRDocument) => {
    putObject(doc, { body: initialDatabaseStateV1() });
  },
};
