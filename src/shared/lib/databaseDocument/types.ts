import { extend, literal, object, partial, type core, type output } from 'zod/v4-mini';
import type { DatabaseState } from './migrations/versions';
export * from './migrations/versions';
import { zodDatabaseState } from './migrations/versions';
import type { CFRDocumentContent } from '../cfrDocument';
import { zodCFRDocumentContent } from '../cfrDocument';

export type DataBaseStateLatest = DatabaseState;

export const DATABASE_DOCUMENT_TYPE = 'database';

export const zodDatabaseType = object({
  type: literal(DATABASE_DOCUMENT_TYPE),
});

export const zodDatabaseExtensionBodyDocument = object({
  body: zodDatabaseState, // todo: может сменить body на другое свойство? отдельное свойство для db
});

export const zodDatabaseTypeDocument = extend(zodCFRDocumentContent, zodDatabaseType.shape);

export type DatabaseTypeDocument = output<typeof zodDatabaseTypeDocument>;

export const zodDatabaseDocumentWithContent = extend(
  zodDatabaseTypeDocument,
  partial(zodDatabaseExtensionBodyDocument).shape,
);

export type DatabaseDocumentWithContent = output<typeof zodDatabaseDocumentWithContent>;

export type MutationFn = (doc: CFRDocumentContent) => unknown;

export type DatabaseDocument = {
  /**
   * Всё содержимое документа
   */
  content: DatabaseTypeDocument | undefined;

  state: DataBaseStateLatest | undefined;

  update: <R>(fn: (doc: DataBaseStateLatest) => R) => Promise<R>;

  /**
   * Ошибки чтения документа
   */
  documentError: core.$ZodError<DatabaseTypeDocument> | undefined;

  /**
   * Принудительное применение миграций
   */
  forceApplyMigration: () => Promise<void>;
};
