import { string } from 'zod/v4-mini';
import type { GeneralProperty, DatabasePropertyId } from './general';
import { zodGeneralProperty, zodDatabasePropertyId } from './general';
import { zodOnlyRecord } from '@shared/lib/zodRecord';

export const zodUnknownPropertyType = string();

export const zodUnknownProperty = zodGeneralProperty(zodUnknownPropertyType);

export const zodUnknownPropertiesMap = zodOnlyRecord(
  zodDatabasePropertyId,
  zodUnknownProperty,
);

export type PropertiesMap<T extends GeneralProperty = GeneralProperty> = {
  [K in DatabasePropertyId]: T;
};
