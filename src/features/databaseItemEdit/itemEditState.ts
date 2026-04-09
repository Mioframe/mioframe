import type { DatabaseItem, DatabasePropertyId } from '@shared/lib/databaseDocument';
import { recordEntries } from '@shared/lib/objectEntries';
import { cloneDeep } from 'es-toolkit';

export const createItemEditState = (
  effectiveItem: DatabaseItem | undefined,
  propertiesIdList: readonly DatabasePropertyId[] | undefined,
): DatabaseItem => {
  const itemState = cloneDeep(effectiveItem) ?? {};

  if (!propertiesIdList) {
    return itemState;
  }

  for (const propertyId of propertiesIdList) {
    if (itemState[propertyId] === undefined) {
      itemState[propertyId] = effectiveItem?.[propertyId];
    }
  }

  return itemState;
};

export const createItemEditPayload = (
  currentItem: DatabaseItem | undefined,
  itemState: DatabaseItem,
  touchedPropertyIdSet: ReadonlySet<DatabasePropertyId>,
): DatabaseItem => {
  const payload = cloneDeep(currentItem) ?? {};

  for (const propertyId of touchedPropertyIdSet) {
    payload[propertyId] = itemState[propertyId];
  }

  return payload;
};

export const syncItemEditState = (
  itemState: DatabaseItem | undefined,
  effectiveItem: DatabaseItem | undefined,
  propertiesIdList: readonly DatabasePropertyId[] | undefined,
  touchedPropertyIdSet: ReadonlySet<DatabasePropertyId>,
): DatabaseItem => {
  const nextItemState = cloneDeep(itemState) ?? {};

  if (propertiesIdList) {
    for (const propertyId of propertiesIdList) {
      if (!touchedPropertyIdSet.has(propertyId)) {
        nextItemState[propertyId] = effectiveItem?.[propertyId];
      }
    }
  }

  if (!effectiveItem) {
    return nextItemState;
  }

  for (const [propertyId, value] of recordEntries(effectiveItem)) {
    if (!touchedPropertyIdSet.has(propertyId)) {
      nextItemState[propertyId] = value;
    }
  }

  return nextItemState;
};
