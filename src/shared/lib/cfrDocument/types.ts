import type { Doc, DocumentId } from '@automerge/automerge-repo';
import type { ReadonlyDeep } from 'type-fest';
import type { TypeOf } from 'zod';
import { object, string, unknown } from 'zod';
import type { DirectoryForAdapter } from '../fsStorageAdapter';
import type {
  ItemWithChildren,
  IterableCollection,
} from '@shared/ui/TreeMenu/useIterable';

export const zodDocumentContent = object({
  name: string(),
  type: string(),
  body: unknown(),
});

/**
 * Conflict-free Replicated Document
 */
export type DocumentContent = TypeOf<typeof zodDocumentContent>;

// частично совместим с DocHandle
export interface CFRDocument<T extends DocumentContent = DocumentContent> {
  doc(): Promise<ReadonlyDeep<Doc<T>> | undefined>;
  delete(): void;
  change(callback: (doc: T) => void): void;
  on: (event: 'change', fn: (payload: { doc: T }) => unknown) => void;
  off: (event: 'change', fn: (payload: { doc: T }) => unknown) => void;
}

export interface DocumentFolder
  extends ItemWithChildren<DocumentId, CFRDocument> {
  create: <Z extends typeof zodDocumentContent>(
    initialValue: TypeOf<Z>,
  ) => CFRDocument<TypeOf<Z>>;
  remove: (documentId: DocumentId) => void;
  onChange: (
    handler: (content: IterableCollection<DocumentId, CFRDocument>) => unknown,
  ) => unknown;
  offChange: (
    handler: (content: IterableCollection<DocumentId, CFRDocument>) => unknown,
  ) => unknown;
}

export interface DirectoryForDocumentFolder extends DirectoryForAdapter {}
