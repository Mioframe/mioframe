import type { AMDocHandle, AMDocumentId } from '@shared/lib/automerge';
import { createGlobalState } from '@vueuse/core';
import { useRepositoriesService } from '../repositories';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { isEqual, isNotNil, omit } from 'es-toolkit';
import { applyCFRDocumentMigration } from '@shared/lib/cfrDocument/migrations';
import type { PatchSource } from '@shared/lib/changeObject';
import { deepPatchJsonObject, deepPutJsonObject } from '@shared/lib/changeObject';
import type { DocHandleChangePayload } from '@automerge/automerge-repo';
import type { UnknownRecord } from 'type-fest';
import {
  auditTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
import { defineObservableQuery } from '@shared/lib/useObservableQuery';
import { DomainError } from '@shared/lib/error';
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';

const setupDocumentService = () => {
  const { getRepo$ } = useRepositoriesService();

  const getDocHandle$ = defineCacheObservable(
    ({ directoryPath, documentId }: { directoryPath: string; documentId?: AMDocumentId }) =>
      getRepo$(directoryPath).pipe(
        filter(isNotNil),
        auditTime(100),
        switchMap((repo) => {
          return new Observable<AMDocHandle | undefined>((subscribe) => {
            if (documentId) {
              void repo
                .find<UnknownRecord>(documentId)
                .then((handle) => {
                  subscribe.next(handle);
                })
                .catch(() => {
                  subscribe.next(undefined);
                });
            } else {
              subscribe.next(undefined);
            }
          });
        }),
        distinctUntilChanged(),
      ),
  );

  const docHandle = defineObservableQuery(getDocHandle$);

  const cfrContent$ = defineCacheObservable((directoryPath: string, documentId?: AMDocumentId) =>
    getDocHandle$({ directoryPath, documentId }).pipe(
      filter(isNotNil),
      switchMap((handle) =>
        new Observable<UnknownRecord | undefined>((subscribe) => {
          const onChange = ({ doc }: DocHandleChangePayload<UnknownRecord>) => {
            subscribe.next(doc);
          };
          const onDelete = () => {
            subscribe.next(undefined);
          };
          handle.addListener('change', onChange);
          handle.addListener('delete', onDelete);

          return () => {
            handle.removeListener('change', onChange);
            handle.removeListener('delete', onDelete);
          };
        }).pipe(startWith(((): UnknownRecord => handle.doc())())),
      ),
      distinctUntilChanged(),
    ),
  );

  const cfrDocumentState$ = defineCacheObservable(
    ({ documentId, path }: { path: string; documentId?: AMDocumentId }) =>
      cfrContent$(path, documentId).pipe(
        map((doc) => {
          if (zodIs(doc, zodCFRDocumentContent)) {
            return doc;
          }

          return undefined;
        }),
        distinctUntilChanged(),
        shareReplay({ bufferSize: 1, refCount: true }),
      ),
  );

  const cfrDocumentState = defineObservableQuery(cfrDocumentState$);

  const documentDescription$ = defineCacheObservable(
    ({ documentId, path }: { path: string; documentId?: AMDocumentId }) =>
      cfrDocumentState$({ documentId, path }).pipe(
        map((state) => {
          if (state) {
            return omit(state, ['body']);
          }
          return undefined;
        }),
        distinctUntilChanged((previous, current) => isEqual(previous, current)),
        shareReplay({ bufferSize: 1, refCount: true }),
      ),
  );

  const put = async (
    directoryPath: string,
    documentId: AMDocumentId,
    content: CFRDocumentContent,
  ) => {
    const handle = await docHandle.fetch({ directoryPath, documentId });

    if (!handle) {
      throw new DomainError(`Document "${documentId}" not found at "${directoryPath}"`);
    }

    handle.change((doc) => {
      const migratedDoc = applyCFRDocumentMigration(doc);

      deepPutJsonObject(migratedDoc, content);
    });
  };

  const patch = async (
    directoryPath: string,
    documentId: AMDocumentId,
    partialContent: PatchSource<CFRDocumentContent>,
  ) => {
    const handle = await docHandle.fetch({ directoryPath, documentId });

    if (!handle) {
      throw new DomainError(`Document "${documentId}" not found at "${directoryPath}"`);
    }

    handle.change((doc) => {
      const migratedDoc = applyCFRDocumentMigration(doc);

      deepPatchJsonObject(migratedDoc, partialContent, { trimString: true });
    });
  };

  const change = async (
    directoryPath: string,
    documentId: AMDocumentId,
    callback: (doc: CFRDocumentContent) => unknown,
  ) => {
    const handle = await docHandle.fetch({ directoryPath, documentId });

    if (!handle) {
      throw new DomainError(`Document "${documentId}" not found at "${directoryPath}"`);
    }

    return new Promise<void>((resolve, reject) => {
      handle.change((doc) => {
        try {
          const cfrDocumentContent = applyCFRDocumentMigration(doc);
          callback(cfrDocumentContent);
          resolve();
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Failed to change document', { cause: error }));
          throw error;
        }
      });
    });
  };

  return {
    documentDescription: defineObservableQuery(documentDescription$),
    put,
    patch,

    change,

    cfrDocumentState$,
    cfrDocumentState,
  };
};

export const useDocumentService = createGlobalState(setupDocumentService);
