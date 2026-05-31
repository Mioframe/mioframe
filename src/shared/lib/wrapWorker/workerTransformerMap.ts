import type { UnknownRecord } from 'type-fest';
import { DomainError } from '../error';
import { defineCustomErrorTransformer, defineTransformer } from '../proxyService';
import type { ClientObject } from '../proxyService';
import { VfsError } from '../virtualFileSystem';
import { GoogleDriveError } from '../googleDrive';
import { GoogleClientConfigError } from '../googleApi';
import { GoogleAuthError } from '@shared/service/google';
import { DeviceDirectoryAccessRequiredError } from '@shared/service/fileSystem/errors';

/** Shared worker/client transformer registry for service transport. */
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

  defineCustomErrorTransformer('GoogleAuthError', GoogleAuthError),
  defineCustomErrorTransformer('GoogleClientConfigError', GoogleClientConfigError),
  defineCustomErrorTransformer(
    'DeviceDirectoryAccessRequiredError',
    DeviceDirectoryAccessRequiredError,
  ),
  defineCustomErrorTransformer('DomainError', DomainError),
  defineCustomErrorTransformer('VfsError', VfsError),
  defineCustomErrorTransformer('GoogleDriveError', GoogleDriveError),
];

/** Worker-client proxy type that preserves transferable handles and known domain errors. */
export type Client<T extends UnknownRecord> = ClientObject<
  T,
  FileSystemHandle | DomainError | VfsError
>;
