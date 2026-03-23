import type { UnknownRecord } from 'type-fest';
import { DomainError } from '../error';
import {
  defineCustomErrorTransformer,
  defineTransformer,
} from '../proxyService';
import type { ClientObject } from '../proxyService';
import { VfsError } from '../virtualFileSystem';
import { GoogleDriveError } from '../googleDrive';

export const transformers = [
  defineTransformer('FileSystemHandle', {
    isApplicable: (v): v is FileSystemHandle => {
      try {
        if ('FileSystemHandle' in globalThis) {
          return v instanceof FileSystemHandle;
        }
      } catch {
        return false;
      }

      return false;
    },
    serialize: (_p, v) => v,
    deserialize: (_p, v) => v,
  }),

  defineCustomErrorTransformer('DomainError', DomainError),
  defineCustomErrorTransformer('VfsError', VfsError),
  defineCustomErrorTransformer('GoogleDriveError', GoogleDriveError),
];

export type Client<T extends UnknownRecord> = ClientObject<
  T,
  FileSystemHandle | DomainError | VfsError
>;
