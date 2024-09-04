import type { DocumentId } from '@automerge/automerge-repo';
import { isValidDocumentId } from '@automerge/automerge-repo';
import { isString } from 'lodash-es';
import type { TypeOf } from 'zod';
import { custom, literal, string, tuple } from 'zod';

export const zodDocumentId = custom<DocumentId>((val) =>
  isValidDocumentId(val),
);

export const zodHash = string();

export type Hash = TypeOf<typeof zodHash>;

export const zodChangedType = literal('snapshot').or(literal('incremental'));

export type ChangedType = TypeOf<typeof zodChangedType>;

export const zodStorageKey = tuple([zodDocumentId, zodChangedType, zodHash]);

export type StorageKey = TypeOf<typeof zodStorageKey>;

export const KEY_SEPARATE = '_';

export const zodFileName =
  custom<`${DocumentId}${typeof KEY_SEPARATE}${ChangedType}${typeof KEY_SEPARATE}${Hash}`>(
    (data) => {
      if (isString(data)) {
        const array = data.split(KEY_SEPARATE);
        if (array.length === 3) {
          return zodStorageKey.safeParse(array).success;
        }
      }
      return false;
    },
  );

export type FileName = TypeOf<typeof zodFileName>;
