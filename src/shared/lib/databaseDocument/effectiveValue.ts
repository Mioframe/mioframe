import type {
  DatabaseItem,
  DatabasePropertyId,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
} from './types';
import { objectEntries, recordEntries } from '../objectEntries';
import { isEqual, isPlainObject, isString } from 'es-toolkit';
import { isArray } from 'es-toolkit/compat';

export const getDatabaseEffectiveValue = (
  item: DatabaseItem | undefined,
  propertyId: DatabasePropertyId,
  property: DatabaseUnknownProperty | undefined,
): unknown => {
  if (item && Object.hasOwn(item, propertyId) && item[propertyId] !== undefined) {
    return item[propertyId];
  }

  return property?.default;
};

export const getDatabaseEffectiveItem = (
  item: DatabaseItem | undefined,
  properties: DatabaseUnknownPropertiesMap | undefined,
): DatabaseItem => {
  const effectiveItem: DatabaseItem = {
    ...(item ?? {}),
  };

  if (!properties) {
    return effectiveItem;
  }

  for (const [propertyId, property] of recordEntries(properties)) {
    const effectiveValue = getDatabaseEffectiveValue(item, propertyId, property);

    if (effectiveValue !== undefined || Object.hasOwn(effectiveItem, propertyId)) {
      effectiveItem[propertyId] = effectiveValue;
    }
  }

  return effectiveItem;
};

const normalizeDatabaseValue = (
  value: unknown,
  { trimString = false }: { trimString?: boolean } = {},
): unknown => {
  if (trimString && isString(value)) {
    return value.trim();
  }

  if (isArray(value)) {
    return value.map((item) => normalizeDatabaseValue(item, { trimString }));
  }

  if (isPlainObject(value)) {
    const normalizedValue: Record<PropertyKey, unknown> = {};

    for (const [key, item] of objectEntries(value)) {
      normalizedValue[key] = normalizeDatabaseValue(item, { trimString });
    }

    return normalizedValue;
  }

  return value;
};

export const shouldStoreDatabaseValue = (
  value: unknown,
  property: DatabaseUnknownProperty | undefined,
  options?: { trimString?: boolean },
): boolean => {
  const normalizedValue = normalizeDatabaseValue(value, options);
  const normalizedDefaultValue = normalizeDatabaseValue(property?.default, options);

  return normalizedValue !== undefined && !isEqual(normalizedValue, normalizedDefaultValue);
};

export const getDatabaseStoredValue = (
  value: unknown,
  property: DatabaseUnknownProperty | undefined,
  options?: { trimString?: boolean },
): unknown => {
  const normalizedValue = normalizeDatabaseValue(value, options);

  return shouldStoreDatabaseValue(normalizedValue, property, options) ? normalizedValue : undefined;
};

export const getDatabaseStoredItem = (
  item: DatabaseItem | undefined,
  properties: DatabaseUnknownPropertiesMap | undefined,
  options?: { trimString?: boolean },
): DatabaseItem => {
  const storedItem: DatabaseItem = {};

  if (!item) {
    return storedItem;
  }

  for (const [propertyId, value] of recordEntries(item)) {
    const storedValue = getDatabaseStoredValue(value, properties?.[propertyId], options);

    if (storedValue !== undefined) {
      storedItem[propertyId] = storedValue;
    }
  }

  return storedItem;
};
