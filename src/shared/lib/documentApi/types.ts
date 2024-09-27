import type { Doc, DocumentId } from '@automerge/automerge-repo';
import type { ReadonlyDeep } from 'type-fest';
import type { TypeOf } from 'zod';
import { object, string, unknown } from 'zod';

export const zodDocument = object({
  name: string(),
  type: string(),
  body: unknown(),
});

/**
 * Conflict-free Replicated Document
 */
export type CRDocument = TypeOf<typeof zodDocument>;

// частично совместим с DocHandle
export interface DocumentApi<T extends CRDocument = CRDocument> {
  doc(): Promise<ReadonlyDeep<Doc<T>> | undefined>;
  delete(): void;
  change(callback: (doc: T) => void): void;
  on: (event: 'change', fn: (payload: { doc: T }) => unknown) => void;
  off: (event: 'change', fn: (payload: { doc: T }) => unknown) => void;
}

export interface FolderApi {
  create: <Z extends typeof zodDocument>(
    initialValue: TypeOf<Z>,
  ) => Promise<DocumentApi<TypeOf<Z>>>;
  remove: (documentId: DocumentId) => Promise<void>;
  getContent: () => Promise<Map<DocumentId, DocumentApi>>;
  onChange: (
    handler: (content: Map<DocumentId, DocumentApi>) => unknown,
  ) => unknown;
  offChange: (
    handler: (content: Map<DocumentId, DocumentApi>) => unknown,
  ) => unknown;
}
