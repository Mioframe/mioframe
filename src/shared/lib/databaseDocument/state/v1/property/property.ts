import { string } from '@zod/mini';
import type { GeneralProperty, PropertyId } from './general';
import { zodGeneralProperty, zodPropertyId } from './general';
import { zodOnlyRecord } from '@shared/lib/zodRecord';

export const zodUnknownPropertyType = string();

export const zodUnknownProperty = zodGeneralProperty(zodUnknownPropertyType);

export const zodUnknownPropertiesMap = zodOnlyRecord(
  zodPropertyId,
  zodUnknownProperty,
);

export type PropertiesMap<T extends GeneralProperty = GeneralProperty> = {
  [K in PropertyId]: T;
};
