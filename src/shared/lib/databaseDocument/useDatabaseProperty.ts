import type { ComputedRef } from 'vue';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { AMDocHandle } from '../automerge';
import type { DatabasePropertyId, DatabaseUnknownProperty } from './types';
import { useDatabasePropertiesMap } from './useDatabasePropertiesMap';
import type { ZodMiniType } from 'zod/v4-mini';
import { zodIs } from '../validateZodScheme';

export function useDatabaseProperty(
  docHandle: MaybeRefOrGetter<AMDocHandle>,
  propertyId: MaybeRefOrGetter<DatabasePropertyId>,
): {
  property: ComputedRef<DatabaseUnknownProperty | undefined>;
};
export function useDatabaseProperty<T>(
  docHandle: MaybeRefOrGetter<AMDocHandle>,
  propertyId: MaybeRefOrGetter<DatabasePropertyId>,
  zodSchema: ZodMiniType<T>,
): {
  property: ComputedRef<T | undefined>;
};
export function useDatabaseProperty(
  docHandle: MaybeRefOrGetter<AMDocHandle>,
  propertyId: MaybeRefOrGetter<DatabasePropertyId>,
  zodSchema?: ZodMiniType,
): {
  property: ComputedRef<DatabaseUnknownProperty | undefined>;
} {
  const map = useDatabasePropertiesMap(docHandle);

  const property = computed((): DatabaseUnknownProperty | undefined => {
    const id = toValue(propertyId);

    const property = map.get(id);

    if (zodSchema) {
      return zodIs(property, zodSchema) ? property : undefined;
    }

    return property;
  });

  return {
    property,
  };
}
