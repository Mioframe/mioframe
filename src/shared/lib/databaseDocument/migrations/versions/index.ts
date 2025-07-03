import type { output } from 'zod/v4-mini';

import type {
  zodDatabaseData,
  zodDatabaseItem,
  zodDatabaseValue,
  zodDatabaseItemId,
  zodDatabaseUnknownPropertiesMap,
  zodDatabaseUnknownProperty,
  zodDatabaseUnknownPropertyType,
  zodDatabasePropertyId,
} from './v1';

export {
  type GeneralProperty,
  type PropertiesMap,
  type PropertyId,
  createProperty,
  generateItemId,
  generatePropertyId,
  zodDatabaseData,
  zodDatabaseItem,
  zodDatabaseValue,
  zodGeneralProperty,
  zodDatabasePropertyId,
  zodDatabaseItemId,
  zodDatabaseUnknownPropertiesMap,
  zodDatabaseUnknownProperty,
  zodDatabaseUnknownPropertyType,
} from './v1';

import type {
  zodDatabaseSortDescription,
  zodDatabaseSortMap,
  zodDatabaseSortDirection,
  zodDatabaseTableView,
  zodDatabaseView,
  zodDatabaseViewId,
  zodDatabaseViewsMap,
} from './v2';

export {
  DB_VIEW_LAYOUT,
  SORT_DIRECTION,
  databaseStateV2,
  generateViewId,
  zodDatabaseSortDirection,
  zodDatabaseSortMap,
  zodDatabaseSortDescription,
  zodDatabaseTableView,
  zodDatabaseView,
  zodDatabaseViewId,
  zodDatabaseViewsMap,
} from './v2';

import { databaseStateV3 } from './v3';

export const zodDatabaseState = databaseStateV3.schema;

export type DatabaseState = output<typeof zodDatabaseState>;
export type DatabaseData = output<typeof zodDatabaseData>;
export type DatabasePropertyId = output<typeof zodDatabasePropertyId>;
export type DatabaseItem = output<typeof zodDatabaseItem>;
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
export type DatabaseSortMap = output<typeof zodDatabaseSortMap>;
export type DatabaseSortDirection = output<typeof zodDatabaseSortDirection>;
export type DatabaseTableView = output<typeof zodDatabaseTableView>;
export type DatabaseView = output<typeof zodDatabaseView>;
export type DatabaseViewId = output<typeof zodDatabaseViewId>;
export type DatabaseViewsMap = output<typeof zodDatabaseViewsMap>;
