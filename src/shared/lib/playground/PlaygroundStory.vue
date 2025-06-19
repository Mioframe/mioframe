<script setup lang="ts" generic="T extends object">
import { useRouteQuery } from '@vueuse/router';
import { cloneDeep, isString } from 'es-toolkit';
import queryString from 'use-qs';
import { nextTick, reactive, toValue, watch, watchEffect } from 'vue';

const { initialState } = defineProps<{
  initialState: T;
}>();

defineSlots<{
  controllers: (p: { state: T }) => unknown;
  space: (p: { state: T }) => unknown;
}>();

const queryState = useRouteQuery('state', undefined, {
  mode: 'replace',
  transform: {
    get: (v: unknown): T => {
      if (isString(v)) {
        return <T>queryString.parse(v);
      }

      return initialState;
    },
    set: (v: T) => {
      return queryString.stringify(cloneDeep(v));
    },
  },
});

// eslint-disable-next-line vue/no-setup-props-reactivity-loss -- initial state
const localState = reactive<T>(initialState);

const localStateWatchHandle = watch(
  localState,
  (localState) => {
    queryWatchHandle.pause();
    queryState.value = toValue(localState);
    void nextTick(() => {
      queryWatchHandle.resume();
    });
  },
  { deep: true },
);

const queryWatchHandle = watchEffect(() => {
  localStateWatchHandle.pause();

  Object.assign(localState, queryState.value);

  void nextTick(() => {
    localStateWatchHandle.resume();
  });
});
</script>

<template>
  <div class="store">
    <div class="store__space">
      <slot name="space" :state="localState" />
    </div>

    <div class="store__controllers">
      <slot name="controllers" :state="localState" />
    </div>
  </div>
</template>

<style lang="css" scoped>
.store {
  display: flex;
  flex: 1 1;
  gap: 16px;

  &__controllers {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  &__space {
    display: block;
    overflow: auto;
    flex: 1 1;
    padding: 16px;

    background-color: #ccc;
    background-image:
      linear-gradient(45deg, #eee 25%, transparent 25%),
      linear-gradient(-45deg, #eee 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #eee 75%),
      linear-gradient(-45deg, transparent 75%, #eee 75%);
    background-size: 20px 20px;
    background-position:
      0 0,
      0 10px,
      10px -10px,
      -10px 0px;
  }
}
</style>
