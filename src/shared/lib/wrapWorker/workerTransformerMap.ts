import type { UnknownRecord } from 'type-fest';
import { DomainError } from '../error';
import { defineCustomErrorTransformer, defineTransformer } from '../proxyService';
import type { ClientObject } from '../proxyService';
import { VfsError } from '../virtualFileSystem';
import { GoogleDriveError } from '../googleDrive';
import { GoogleClientConfigError } from '../googleApi';
import { WebFileSystemAccessRequiredError } from '../webFileSystemProvider';
import { GoogleAuthError } from '../googleAuth';

/** Shared worker/client transformer registry for service transport. */
export const transformers = [
  defineTransformer('ArrayBuffer', {
    isApplicable: (value): value is ArrayBuffer => value instanceof ArrayBuffer,
    serialize: (_provider, value) => value,
    deserialize: (_provider, value) => value,
  }),

  defineTransformer('Uint8Array', {
    isApplicable: (value): value is Uint8Array => value instanceof Uint8Array,
    serialize: (_provider, value) =>
      value.byteOffset === 0 && value.byteLength === value.buffer.byteLength
        ? value.buffer
        : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
    deserialize: (_provider, value) => new Uint8Array(value),
  }),

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

  defineTransformer('Blob', {
    isApplicable: (v): v is Blob => {
      try {
        return v instanceof Blob;
      } catch {
        return false;
      }
    },
    serialize: (_p, v) => v,
    deserialize: (_p, v) => v,
  }),

  defineCustomErrorTransformer('GoogleAuthError', GoogleAuthError),
  defineCustomErrorTransformer('GoogleClientConfigError', GoogleClientConfigError),
  defineCustomErrorTransformer(
    'WebFileSystemAccessRequiredError',
    WebFileSystemAccessRequiredError,
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
