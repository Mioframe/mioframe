import type * as AMRR from '@automerge/automerge-repo';
import type * as AMR from '@automerge/automerge';
import type { UnknownRecord } from 'type-fest';

export type AMDocHandle<T extends object = UnknownRecord> = AMRR.DocHandle<T>;

export type AMDocumentId = AMRR.DocumentId;

export type AMDoc<T extends object = UnknownRecord> = AMRR.Doc<T>;

export type AMValue = AMR.AutomergeValue;

export type AMChangeFn<T> = AMRR.ChangeFn<T>;

export type AMDocHandleChangePayload<T> = AMRR.DocHandleChangePayload<T>;

export type AMDocHandleDeletePayload<T> = AMRR.DocHandleDeletePayload<T>;

export type AMStorageAdapterInterface = AMRR.StorageAdapterInterface;

export type AMChunk = AMRR.Chunk;
