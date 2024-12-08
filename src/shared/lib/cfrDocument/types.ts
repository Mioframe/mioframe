import type { DocumentId } from '@automerge/automerge-repo';
import type { TypeOf } from 'zod';
import { number, object, string, unknown } from 'zod';
import type { DirectoryForAdapter } from '../fsStorageAdapter';
import type {
  ItemWithChildren,
  IterableCollection,
} from '@shared/ui/TreeMenu/useIterable';

import type { AutomergeValue } from '@automerge/automerge';

export type AutomergeMap = {
  [Key in string]?: AutomergeValue;
};

export const zodDocumentContent = object({
  name: string(),
  type: string(),
  body: unknown(),
  version: number().int(),
});

/**
 * Conflict-free Replicated Document
 */
export type DocumentContent = TypeOf<typeof zodDocumentContent>;

// частично совместим с DocHandle // TODO: может следует разделить CFRDocument и DocHandle
export interface CFRDocument {
  doc(): Promise<DocumentContent | undefined>;
  delete(): void;
  change(callback: (doc: DocumentContent) => void): void;
  on: (
    event: 'change',
    fn: (payload: { doc?: DocumentContent }) => unknown,
  ) => void;
  off: (
    event: 'change',
    fn: (payload: { doc?: DocumentContent }) => unknown,
  ) => void;
}

export interface DocumentFolder
  extends ItemWithChildren<DocumentId, CFRDocument> {
  create: <Z extends typeof zodDocumentContent>(
    initialValue: TypeOf<Z>,
  ) => CFRDocument;
  remove: (documentId: DocumentId) => void;
  onChange: (
    handler: (content: IterableCollection<DocumentId, CFRDocument>) => unknown,
  ) => unknown;
  offChange: (
    handler: (content: IterableCollection<DocumentId, CFRDocument>) => unknown,
  ) => unknown;
}

export interface DirectoryForDocumentFolder extends DirectoryForAdapter {}
