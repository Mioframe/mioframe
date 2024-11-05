import type { TypeOf } from 'zod';
import { record, string } from 'zod';
import type { GeneralProperty, PropertyId } from './general';
import { zodGeneralProperty, zodPropertyId } from './general';

export const zodUnknownPropertyType = string();

export const zodUnknownProperty = zodGeneralProperty(zodUnknownPropertyType);

export type UnknownProperty = TypeOf<typeof zodUnknownProperty>;

export const zodUnknownPropertiesMap = record(
  zodPropertyId,
  zodUnknownProperty,
);

export type UnknownPropertiesMap = TypeOf<typeof zodUnknownPropertiesMap>;

export type PropertiesMap<T extends GeneralProperty> = {
  [K in PropertyId]: T;
};
