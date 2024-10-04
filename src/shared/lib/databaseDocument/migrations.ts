import { putObject } from '../changeObject';
import type { DocumentContent } from '../cfrDocument';
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
  [CURRENT_VERSION: number]: <D extends DocumentContent>(doc: D) => void;
} = {
  0: (doc: DocumentContent) => {
    putObject(doc, { body: initialDatabaseStateV1() });
  },
} as const;
