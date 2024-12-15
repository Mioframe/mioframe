import { zodDatabaseTypeDocument, type MutationFn } from '../types';
import type { View } from './general';
import type { ViewId } from './viewId';
import { generateViewId } from './viewId';
import { is } from '@shared/lib/validateZodScheme';
import { applyDatabaseDocumentMigration } from '../migrations';
import { putObject } from '@shared/lib/changeObject';
import type { PropertyId } from '../property';
import type { SortDescription } from './sorting';
import { SORT_DIRECTION } from './sorting';


export const addViewMutation = (
  change: (mutation: MutationFn) => unknown,
  view: View,
): Promise<ViewId> =>
  new Promise((resolve, reject) => {
    change((doc) => {
      if (!is(doc, zodDatabaseTypeDocument)) {
        reject(new Error('document is not DatabaseTypeDocument'));
        return;
      }

      const viewId = generateViewId();
      const databaseDocument = applyDatabaseDocumentMigration(doc);

      putObject(databaseDocument, { body: { views: { [viewId]: view } } });
      resolve(viewId);
    });
  });

export const removeViewMutation = (
  change: (mutation: MutationFn) => unknown,
  viewId: ViewId,
): Promise<void> =>
  new Promise((resolve, reject) => {
    change((doc) => {
      if (!is(doc, zodDatabaseTypeDocument)) {
        reject(new Error('document is not DatabaseTypeDocument'));
        return;
      }

      const databaseDocument = applyDatabaseDocumentMigration(doc);

      delete databaseDocument.body?.views?.[viewId];

      resolve();
    });
  });

export const addSortDescriptionMutation = async (
  change: (mutation: MutationFn) => unknown,
  viewId: ViewId,
  sortDescription: SortDescription,
): Promise<void> =>
  new Promise((resolve, reject) => {
    change((doc) => {
      if (!is(doc, zodDatabaseTypeDocument)) {
        reject(new Error('document is not DatabaseTypeDocument'));
        return;
      }

      const databaseDocument = applyDatabaseDocumentMigration(doc);

      const sorting = databaseDocument.body?.views?.[viewId]?.sorting;

      if (sorting) {
        const beforeSortingDescriptionIndex = sorting.findIndex(
          (item) => item.propertyId === sortDescription.propertyId,
        );
        if (beforeSortingDescriptionIndex >= 0) {
          sorting.splice(beforeSortingDescriptionIndex, 1);
        }

        sorting.push(sortDescription);
      } else {
        putObject(databaseDocument, {
          body: {
            views: {
              [viewId]: {
                sorting: [sortDescription],
              },
            },
          },
        });
      }

      resolve();
    });
  });

export const toggleSortDirectionMutation = async (
  change: (mutation: MutationFn) => unknown,
  viewId: ViewId,
  propertyId: PropertyId,
): Promise<void> =>
  new Promise((resolve, reject) => {
    change((doc) => {
      if (!is(doc, zodDatabaseTypeDocument)) {
        reject(new Error('document is not DatabaseTypeDocument'));
        return;
      }

      const databaseDocument = applyDatabaseDocumentMigration(doc);

      const sorting = databaseDocument.body?.views?.[viewId]?.sorting ?? [];

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

      putObject(databaseDocument, {
        body: {
          views: {
            [viewId]: {
              sorting,
            },
          },
        },
      });

      resolve();
    });
  });
