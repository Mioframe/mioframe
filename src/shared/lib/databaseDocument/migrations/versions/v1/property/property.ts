import type { output } from 'zod/v4-mini';
import { string } from 'zod/v4-mini';
import type { GeneralProperty, DatabasePropertyId } from './general';
import { zodGeneralProperty, zodDatabasePropertyId } from './general';
import type { StrictRecord } from '@shared/lib/strictRecord';
import { zodStrictRecord } from '@shared/lib/strictRecord';

export const zodUnknownPropertyType = string();

export const zodUnknownProperty = zodGeneralProperty(zodUnknownPropertyType);

export const zodUnknownPropertiesMap = zodStrictRecord(zodDatabasePropertyId, zodUnknownProperty);

export type UnknownPropertiesMap = output<typeof zodUnknownPropertiesMap>;

export type PropertiesMap1<T extends GeneralProperty = GeneralProperty> = {
  [K in DatabasePropertyId]: T;
};

export type PropertiesMap<T extends GeneralProperty = GeneralProperty> = StrictRecord<
  DatabasePropertyId,
  T
>;
