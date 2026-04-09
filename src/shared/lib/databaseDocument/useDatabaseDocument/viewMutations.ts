import { deepPatchJsonObject } from '@shared/lib/changeObject';
import type { DataBaseStateLatest } from '../types';
import type { DatabaseState } from '../migrations/versions';
import {
  generateViewId,
  type DatabaseView,
  type DatabaseViewId,
  type DatabaseViewsMap,
} from '../migrations/versions';

export type MutationFn = (views: DatabaseViewsMap) => unknown;

export const addViewMutation = (body: DataBaseStateLatest, view: DatabaseView): DatabaseViewId => {
  const viewId = generateViewId();

  deepPatchJsonObject(body, { views: { [viewId]: view } });

  return viewId;
};

export const removeViewMutation = (body: DataBaseStateLatest, viewId: DatabaseViewId) => {
  const views = body.views;
  if (viewId in views) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- automerge recommended
    delete views[viewId];
  }
};

export const renameViewMutation = (
  body: DatabaseState,
  viewId: DatabaseViewId,
  newName: string,
) => {
  deepPatchJsonObject(body, {
    views: {
      [viewId]: {
        name: newName,
      },
    },
  });
};
