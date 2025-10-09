import type { AMDocumentId } from '@shared/lib/automerge';
import {
  deepPatchJsonObject,
  deepPutJsonObject,
  type PatchSource,
} from '@shared/lib/changeObject';
import type {
  DatabaseFilter,
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { DomainError } from '@shared/lib/error';
import { defineSubscribeByQueryService } from '@shared/lib/subscriptions';

export const useDatabaseViewFilterService = (
  getView: (
    path: string[],
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ) => undefined | DomainError | DatabaseView,
  changeView: (
    path: string[],
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    cb: (view: DatabaseView) => unknown,
  ) => unknown,
) => {
  const get = (
    path: string[],
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ) => {
    const view = getView(path, documentId, viewId);

    if (view instanceof DomainError) {
      return view;
    }

    return view?.filter;
  };

  const change = (
    path: string[],
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    cb: (view: DatabaseFilter) => unknown,
  ) =>
    changeView(path, documentId, viewId, (view) => {
      if (!view.filter) {
        view.filter = {};
      }

      cb(view.filter);
    });

  const patch = (
    path: string[],
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    source: PatchSource<DatabaseFilter>,
  ) =>
    change(path, documentId, viewId, (filter) => {
      deepPatchJsonObject(filter, source, { trimString: true });
    });

  const post = (
    path: string[],
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    source: DatabaseFilter,
  ) =>
    change(path, documentId, viewId, (filter) => {
      deepPutJsonObject(filter, source, { trimString: true });
    });

  return {
    subscribeGet: defineSubscribeByQueryService(get),
    patch,
    post,
  };
};
