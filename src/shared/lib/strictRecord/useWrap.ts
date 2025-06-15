import type { MaybeRefOrGetter } from '@vueuse/core';
import type { ComputedRef } from 'vue';
import { computed, toValue } from 'vue';
import type { WrapStrictRecord } from './wrapStrictRecord';
import { wrapStrictRecord } from './wrapStrictRecord';
import type { StrictRecord } from './types';

export function useWrapStrictRecord<K extends string, V>(
  strictRecordRef: MaybeRefOrGetter<StrictRecord<K, V>>,
): ComputedRef<WrapStrictRecord<K, V>>;
export function useWrapStrictRecord<K extends string, V>(
  strictRecordRef: MaybeRefOrGetter<StrictRecord<K, V> | undefined>,
): ComputedRef<WrapStrictRecord<K, V> | undefined>;
export function useWrapStrictRecord<K extends string, V>(
  strictRecordRef: MaybeRefOrGetter<StrictRecord<K, V> | undefined>,
): ComputedRef<WrapStrictRecord<K, V> | undefined> {
  return computed((): WrapStrictRecord<K, V> | undefined => {
    const value = toValue(strictRecordRef);

    return value ? wrapStrictRecord(value) : undefined;
  });
}
