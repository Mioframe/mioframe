import { string } from '@zod/mini';
import type { GeneralProperty, PropertyId } from './general';
import { zodGeneralProperty, zodPropertyId } from './general';
import { zodRequireRecord } from '@shared/lib/zodRequireRecord';

export const zodUnknownPropertyType = string();

export const zodUnknownProperty = zodGeneralProperty(zodUnknownPropertyType);

export const zodUnknownPropertiesMap = zodRequireRecord(
  zodPropertyId,
  zodUnknownProperty,
);

export type PropertiesMap<T extends GeneralProperty = GeneralProperty> = {
  [K in PropertyId]: T;
};
