import type { AMDocHandle, AMDocumentId } from '@shared/lib/automerge';
import { createGlobalState } from '@vueuse/core';
import { useRepositoriesService } from '../repositories';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { isEqual, isNotNil, omit } from 'es-toolkit';
import { applyCFRDocumentMigration } from '@shared/lib/cfrDocument/migrations';
import type { PatchSource } from '@shared/lib/changeObject';
import {
  deepPatchJsonObject,
  deepPutJsonObject,
} from '@shared/lib/changeObject';
import type { DocHandleChangePayload } from '@automerge/automerge-repo';
import type { UnknownRecord } from 'type-fest';
import {
  distinctUntilChanged,
  filter,
  finalize,
  map,
  Observable,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
import { defineQuery } from '@shared/lib/observableQuery';
import { DomainError } from '@shared/lib/error';

export const useDocumentService = createGlobalState(() => {
  const { getRepo$ } = useRepositoriesService();

  const docHandle$Cache = new Map<
    string,
    Observable<AMDocHandle | undefined>
  >();

  const getDocHandle$ = ({
    directoryPath,
    documentId,
  }: {
    directoryPath: string;
    documentId?: AMDocumentId;
  }) => {
    const cacheKey = `${directoryPath}:${documentId ?? 'undefined'}`;

    let docHandle$ = docHandle$Cache.get(cacheKey);

    if (!docHandle$) {
      docHandle$ = getRepo$(directoryPath).pipe(
        filter(isNotNil),
        switchMap((repo) => {
          return new Observable<AMDocHandle | undefined>((subscribe) => {
            if (documentId) {
              void repo.find<UnknownRecord>(documentId).then((handle) => {
                subscribe.next(handle);
              });
            } else {
              subscribe.next(undefined);
            }
          });
        }),
        distinctUntilChanged(),
        finalize(() => docHandle$Cache.delete(cacheKey)),
        shareReplay({ bufferSize: 1, refCount: true }),
      );

      docHandle$Cache.set(cacheKey, docHandle$);
    }

    return docHandle$;
  };

  const docHandle = defineQuery(getDocHandle$);

  const cfrContent$Cache = new Map<
    string,
    Observable<UnknownRecord | undefined>
  >();

  const cfrContent$ = (directoryPath: string, documentId?: AMDocumentId) => {
    const cacheKey = `${directoryPath}:${documentId ?? 'undefined'}`;

    let $ = cfrContent$Cache.get(cacheKey);

    if (!$) {
      $ = getDocHandle$({ directoryPath, documentId }).pipe(
        filter(isNotNil),
        switchMap((handle) =>
          new Observable<UnknownRecord | undefined>((subscribe) => {
            const onChange = ({
              doc,
            }: DocHandleChangePayload<UnknownRecord>) => {
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
        finalize(() => cfrContent$Cache.delete(cacheKey)),
        shareReplay({ bufferSize: 1, refCount: true }),
      );

      cfrContent$Cache.set(cacheKey, $);
    }

    return $;
  };

  const cfrDocumentState$ = ({
    documentId,
    path,
  }: {
    path: string;
    documentId?: AMDocumentId;
  }) =>
    cfrContent$(path, documentId).pipe(
      map((doc) => {
        if (zodIs(doc, zodCFRDocumentContent)) {
          return doc;
        }

        return undefined;
      }),
      distinctUntilChanged(),
    );

  const cfrDocumentState = defineQuery(cfrDocumentState$);

  const documentDescription$ = ({
    documentId,
    path,
  }: {
    path: string;
    documentId?: AMDocumentId;
  }) =>
    cfrDocumentState$({ documentId, path }).pipe(
      map((state) => {
        if (state) {
          return omit(state, ['body']);
        }
        return undefined;
      }),
      distinctUntilChanged((previous, current) => isEqual(previous, current)),
    );

  const put = async (
    directoryPath: string,
    documentId: AMDocumentId,
    content: CFRDocumentContent,
  ) => {
    const handle = await docHandle.fetch({ directoryPath, documentId });

    if (!handle) {
      throw new DomainError(
        `Document "${documentId}" not found at "${directoryPath}"`,
      );
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
      throw new DomainError(
        `Document "${documentId}" not found at "${directoryPath}"`,
      );
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
      throw new DomainError(
        `Document "${documentId}" not found at "${directoryPath}"`,
      );
    }

    return new Promise<void>((resolve, reject) => {
      handle.change((doc) => {
        try {
          const cfrDocumentContent = applyCFRDocumentMigration(doc);
          callback(cfrDocumentContent);
          resolve();
        } catch (error) {
          reject(error);
          throw error;
        }
      });
    });
  };

  return {
    documentDescription: defineQuery(documentDescription$),
    put,
    patch,

    change,

    cfrDocumentState$,
    cfrDocumentState,
  };
});
