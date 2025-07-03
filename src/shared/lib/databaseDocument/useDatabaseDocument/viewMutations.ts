import { deepPutJsonObject } from '@shared/lib/changeObject';
import type { DataBaseStateLatest } from '../types';
import type { DatabaseState } from '../migrations/state';
import {
  generateViewId,
  type DatabaseView,
  type DatabaseViewId,
  type DatabaseViewsMap,
} from '../migrations/state';

export type MutationFn = (views: DatabaseViewsMap) => unknown;

export const addViewMutation = (
  body: DataBaseStateLatest,
  view: DatabaseView,
): DatabaseViewId => {
  const viewId = generateViewId();

  deepPutJsonObject(body, { views: { [viewId]: view } });

  return viewId;
};

export const removeViewMutation = (
  body: DataBaseStateLatest,
  viewId: DatabaseViewId,
) => {
  const views = body.views;
  if (views && viewId in views) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- automerge recommended
    delete views[viewId];
  }
};

export const renameViewMutation = (
  body: DatabaseState,
  viewId: DatabaseViewId,
  newName: string,
) => {
  deepPutJsonObject(body, {
    views: {
      [viewId]: {
        name: newName,
      },
    },
  });
};
