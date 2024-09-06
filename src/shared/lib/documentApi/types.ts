import type { Doc } from '@automerge/automerge-repo';
import type { ReadonlyDeep } from 'type-fest';
import type { TypeOf } from 'zod';
import { object, string, unknown } from 'zod';

export const zodDocument = object({
  name: string(),
  body: unknown(),
});

export type Document = TypeOf<typeof zodDocument>;

export interface DocumentApi<T = unknown> {
  doc(): Promise<ReadonlyDeep<Doc<T>> | undefined>;
  delete(): void;
  change(callback: (doc: T) => void): void;
}

export interface FolderApi {
  create: <Z extends typeof zodDocument>(
    initialValue: TypeOf<Z>,
    zod: Z,
  ) => Promise<DocumentApi<TypeOf<Z>>>;
  getContent: () => Promise<Map<string, unknown>>;
}
