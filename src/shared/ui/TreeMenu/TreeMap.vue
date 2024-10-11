<script
  lang="ts"
  setup
  generic="
    O extends object,
    K extends string | number,
    T extends AsyncMap<K, T> | O
  "
>
import { computed, toRef, watchEffect } from 'vue';
import { useAsyncMap, type AsyncMap } from './useAsyncMap';
import TreeMapItem from './TreeMapItem.vue';

const props = defineProps<{
  map: AsyncMap<K, T>;
  activeKey?: K;
  activeItem?: T;
  filter?: (v: [K, T]) => boolean;
}>();

const emit = defineEmits<{
  click: [key: K, item: T];
  'update:loading': [loading: boolean];
}>();

const slots = defineSlots<{
  contextMenu(props: {
    key: K;
    item: T;
    listOpen?: boolean;
    loading?: boolean;
  }): unknown;
  label(props: {
    key: K;
    item: T;
    listOpen?: boolean;
    loading?: boolean;
  }): unknown;
  icon(props: {
    key: K;
    item: T;
    listOpen?: boolean;
    loading?: boolean;
  }): unknown;
}>();

const onClick = (key: K, item: T) => {
  emit('click', key, item);
};

const { map: mapRef, fetchMap, loading } = useAsyncMap(toRef(() => props.map));

watchEffect(() => {
  emit('update:loading', loading.value);
});

const filteredMap = computed(() => {
  if (props.filter) {
    return Array.from(mapRef.value).filter(props.filter);
  }
  return mapRef.value;
});

void fetchMap();
</script>

<template>
  <ul class="menu-list">
    <TreeMapItem
      v-for="[key, item] in filteredMap"
      :key="key"
      :item-key="key"
      :item="item"
      :active-key
      :active-item
      :filter
      @click="onClick"
    >
      <template #label="scoped">
        <slot
          :key="scoped.key"
          name="label"
          :item="scoped.item"
          :list-open="scoped.listOpen"
          :loading="scoped.loading"
        />
      </template>

      <template v-if="!!slots.contextMenu" #contextMenu="scoped">
        <slot
          :key="scoped.key"
          name="contextMenu"
          :item="scoped.item"
          :list-open="scoped.listOpen"
          :loading="scoped.loading"
        />
      </template>

      <template v-if="!!slots.icon" #icon="scoped">
        <slot
          :key="scoped.key"
          name="icon"
          :item="scoped.item"
          :list-open="scoped.listOpen"
          :loading="scoped.loading"
        />
      </template>
    </TreeMapItem>
  </ul>
</template>

<style lang="scss" scoped>
.menu-list {
  --bulma-menu-nested-list-margin: 0.75em 0 0.75em 0.75em;
}
</style>
