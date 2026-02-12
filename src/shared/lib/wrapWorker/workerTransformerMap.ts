import type { UnknownRecord } from 'type-fest';
import { DomainError } from '../error';
import { defineTransformer } from '../proxyService/proxyService';
import type { ClientObject } from '../proxyService';
import { VfsError } from '../virtualFileSystem';

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
  defineTransformer('DomainError', {
    isApplicable: (v): v is DomainError => v instanceof DomainError,
    serialize: (_p, v) => v.toJSON(),
    deserialize: (_p, v) => new DomainError(v),
  }),
  defineTransformer('VfsError', {
    isApplicable: (v): v is VfsError => v instanceof VfsError,
    serialize: (_p, v) => {
      return {
        name: v.name,
        message: v.message,
        code: v.code,
        cause: v.cause,
        stack: v.stack,
      };
    },
    deserialize: (_p, v) => {
      // Создаем новый экземпляр VfsError с полями из сериализованного объекта
      const error = new VfsError(v.code, v.message, v.cause);
      error.name = v.name;
      error.stack = v.stack;
      return error;
    },
  }),
];

export type Client<T extends UnknownRecord> = ClientObject<
  T,
  FileSystemHandle | DomainError | VfsError
>;
