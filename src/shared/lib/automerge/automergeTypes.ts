import type * as AMRR from '@automerge/automerge-repo';
import { isValidDocumentId } from '@automerge/automerge-repo';
import type * as AMR from '@automerge/automerge';
import type { UnknownRecord } from 'type-fest';
import type { output } from 'zod/v4-mini';
import { custom, refine, string } from 'zod/v4-mini';
import { isString } from 'es-toolkit';

export type AMDocHandle<T extends object = UnknownRecord> = AMRR.DocHandle<T>;

const zodStrictDocumentId = custom<AMRR.DocumentId>(
  (val: unknown): val is AMRR.DocumentId => isString(val) && isValidDocumentId(val),
);

export const zodSimpleDocumentId = string().check(
  refine((v): v is AMRR.DocumentId => isValidDocumentId(v)),
);

export const zodDocumentId = zodStrictDocumentId;

export type AMDocumentId = output<typeof zodStrictDocumentId>;

export type AMDoc<T extends object = UnknownRecord> = AMRR.Doc<T>;

export type AMValue = AMR.ScalarValue | AMMapObject | Array<AMValue>;

export type AMMapObject = {
  [P in string]?: AMValue;
};

export type AMChangeFn<T extends object = UnknownRecord> = AMRR.ChangeFn<T>;

export type AMDocHandleChangePayload<T extends object = UnknownRecord> =
  AMRR.DocHandleChangePayload<T>;

export type AMDocHandleDeletePayload<T extends object = UnknownRecord> =
  AMRR.DocHandleDeletePayload<T>;

export type AMStorageAdapterInterface = AMRR.StorageAdapterInterface;

export type AMChunk = AMRR.Chunk;
