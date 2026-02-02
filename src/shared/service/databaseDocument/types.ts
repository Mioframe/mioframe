import type { Patch } from '@automerge/automerge';
import type { DatabaseTypeDocument } from '@shared/lib/databaseDocument';
import type { UnknownRecord } from 'type-fest';

export type ChangeDatabasePayload = {
  doc: DatabaseTypeDocument;
  patches: Patch[];
  patchInfo: {
    before: UnknownRecord;
    after: DatabaseTypeDocument;
  };
};
