import type { UnknownRecord } from 'type-fest';
import { DomainError } from '../error';
import { defineTransformer } from '../proxyService/proxyService';
import type { ClientObject } from '../proxyService';

export const transformers = [
  defineTransformer('FileSystemHandle', {
    isApplicable: (v): v is FileSystemHandle => v instanceof FileSystemHandle,
    serialize: (_p, v) => v,
    deserialize: (_p, v) => v,
  }),
  defineTransformer('DomainError', {
    isApplicable: (v): v is DomainError => v instanceof DomainError,
    serialize: (_p, v) => v.toJSON(),
    deserialize: (_p, v) => new DomainError(v),
  }),
];

export type Client<T extends UnknownRecord> = ClientObject<
  T,
  FileSystemHandle | DomainError
>;
