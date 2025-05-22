import type { output } from '@zod/mini';

import type {
  zodDatabaseData,
  zodDatabaseItem,
  //   zodDatabaseState,
  zodDatabaseValue,
  zodDatabaseItemId,
  zodDatabaseUnknownPropertiesMap,
  zodDatabaseUnknownProperty,
  zodDatabaseUnknownPropertyType,
  zodDatabasePropertyId,
} from '../v1';

import type {
  zodDatabaseState,
  zodDatabaseSortDescription,
  zodDatabaseSortList,
  zodDatabaseSortDirection,
  zodDatabaseTableView,
  zodDatabaseView,
  zodDatabaseViewId,
  zodDatabaseViewsMap,
} from '../v2';

export type DatabaseData = output<typeof zodDatabaseData>;
export type DatabasePropertyId = output<typeof zodDatabasePropertyId>;
export type DatabaseItem = output<typeof zodDatabaseItem>;
export type DatabaseState = output<typeof zodDatabaseState>;
export type DatabaseValue = output<typeof zodDatabaseValue>;
export type DatabaseItemId = output<typeof zodDatabaseItemId>;
export type DatabaseUnknownPropertiesMap = output<
  typeof zodDatabaseUnknownPropertiesMap
>;
export type DatabaseUnknownProperty = output<typeof zodDatabaseUnknownProperty>;
export type DatabaseUnknownPropertyType = output<
  typeof zodDatabaseUnknownPropertyType
>;

export type DatabaseSortDescription = output<typeof zodDatabaseSortDescription>;
export type DatabaseSortList = output<typeof zodDatabaseSortList>;
export type DatabaseSortDirection = output<typeof zodDatabaseSortDirection>;
export type DatabaseTableView = output<typeof zodDatabaseTableView>;
export type DatabaseView = output<typeof zodDatabaseView>;
export type DatabaseViewId = output<typeof zodDatabaseViewId>;
export type DatabaseViewsMap = output<typeof zodDatabaseViewsMap>;
