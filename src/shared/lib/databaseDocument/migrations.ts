import { putObject } from '../changeObject';
import type { DocumentContent } from '../cfrDocument';
import { initialDatabaseStateV1, initialDatabaseStateV2 } from './versions';

/**
 * Миграция должна проверять текущую версию документа
 * Запускать последовательные миграции начиная с нужной версии до конца
 */
export const migrationsMap: {
  [CURRENT_VERSION: number]: (doc: DocumentContent) => void;
} = {
  0: (doc: DocumentContent) => {
    putObject(doc, { body: initialDatabaseStateV1() });
  },
  1: (doc: DocumentContent) => {
    putObject(doc, { body: initialDatabaseStateV2() });
  },
} as const;
