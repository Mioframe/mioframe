import { zodIs } from '@shared/lib/validateZodScheme';
import { putObject } from '@shared/lib/changeObject';
import type { DataBaseStateLatest } from '../types';
import type {
  DatabasePropertyId,
  DatabaseSortDescription,
  DatabaseState,
} from '../state';
import {
  generateViewId,
  SORT_DIRECTION,
  zodDatabaseTableView,
  type DatabaseView,
  type DatabaseViewId,
  type DatabaseViewsMap,
} from '../state';

export type MutationFn = (views: DatabaseViewsMap) => unknown;

export const addViewMutation = (
  body: DataBaseStateLatest,
  view: DatabaseView,
): DatabaseViewId => {
  const viewId = generateViewId();

  putObject(body, { views: { [viewId]: view } });

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

export const addSortDescriptionMutation = (
  body: DataBaseStateLatest,
  viewId: DatabaseViewId,
  sortDescription: DatabaseSortDescription,
) => {
  const view = body.views?.[viewId];

  if (!zodIs(view, zodDatabaseTableView)) {
    throw new Error(`view "${viewId}" is not table layout`);
  }

  const sorting = view.sorting;

  if (sorting) {
    const beforeSortingDescriptionIndex = sorting.findIndex(
      (item) => item.propertyId === sortDescription.propertyId,
    );
    if (beforeSortingDescriptionIndex >= 0) {
      sorting.splice(beforeSortingDescriptionIndex, 1);
    }

    sorting.push(sortDescription);
  } else {
    putObject(body, {
      views: {
        [viewId]: {
          sorting: [sortDescription],
        },
      },
    });
  }
};

export const toggleSortDirectionMutation = (
  body: DatabaseState,
  viewId: DatabaseViewId,
  propertyId: DatabasePropertyId,
) => {
  const view = body.views?.[viewId];

  if (!zodIs(view, zodDatabaseTableView)) {
    throw new Error(`view "${viewId}" is not table layout`);
  }

  const sorting = view.sorting ?? [];

  const beforeSortingDescription = sorting.find(
    (item) => item.propertyId === propertyId,
  );

  const newDirection =
    beforeSortingDescription?.direction === SORT_DIRECTION.ascending
      ? SORT_DIRECTION.descending
      : SORT_DIRECTION.ascending;

  if (beforeSortingDescription) {
    beforeSortingDescription.direction = newDirection;
    delete beforeSortingDescription.manual;
  } else {
    sorting.push({
      propertyId,
      direction: newDirection,
    });
  }

  putObject(view, {
    sorting,
  });
};

export const renameViewMutation = (
  body: DatabaseState,
  viewId: DatabaseViewId,
  newName: string,
) => {
  putObject(body, {
    views: {
      [viewId]: {
        name: newName,
      },
    },
  });
};
