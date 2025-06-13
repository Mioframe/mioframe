import type {
  ChangeFn as OriginalChangeFn,
  DocHandleChangePayload as OriginalDocHandleChangePayload,
  DocHandleDeletePayload as OriginalDocHandleDeletePayload,
  StorageAdapterInterface as OriginalStorageAdapterInterface,
} from '@automerge/automerge-repo';
import type { AutomergeValue as OriginalAutomergeValue } from '@automerge/automerge';

import type { UnknownRecord } from 'type-fest';

export interface DocHandle<T = UnknownRecord> {
  documentId: DocumentId;
  //   addListener: DocHandle1<T>['addListener'];
  addListener(n: 'change', f: (p: DocHandleChangePayload<T>) => void): void;
  addListener(n: 'delete', f: (p: DocHandleDeletePayload<T>) => void): void;
  removeListener(
    event: 'delete',
    fn?: (payload: DocHandleDeletePayload<T>) => void,
  ): DocHandle<T>;
  removeListener(
    event: 'change',
    fn?: (payload: DocHandleChangePayload<T>) => void,
  ): DocHandle<T>;
  change(callback: OriginalChangeFn<T>): void;
  doc(): Promise<Doc<T> | undefined>;
}

export type DocumentId = string & { __documentId: true };

export type Doc<T> = {
  readonly [P in keyof T]: T[P];
};

export type AutomergeValue = OriginalAutomergeValue;

export type ChangeFn<T> = OriginalChangeFn<T>;

export type DocHandleChangePayload<T> = OriginalDocHandleChangePayload<T>;

export type DocHandleDeletePayload<T> = OriginalDocHandleDeletePayload<T>;

export type StorageAdapterInterface = OriginalStorageAdapterInterface;

type StorageKey = string[];

export type Chunk = {
  key: StorageKey;
  data: Uint8Array | undefined;
};
