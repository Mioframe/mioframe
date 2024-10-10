<script
  lang="ts"
  setup
  generic="
    O extends object,
    K extends string | number,
    T extends AsyncMap<K, T> | O
  "
>
import { toRef } from 'vue';
import { useAsyncMap, type AsyncMap } from './useAsyncMap';
import TreeMapItem from './TreeMapItem.vue';

const props = defineProps<{
  map: AsyncMap<K, T>;
  activeKey?: K;
  activeItem?: T;
}>();

const emit = defineEmits<{
  click: [key: K, item: T];
}>();

const slots = defineSlots<{
  contextMenu(props: { key: K; item: T }): unknown;
  label(props: { key: K; item: T }): unknown;
}>();

const onClick = (key: K, item: T) => {
  emit('click', key, item);
};

const { map: mapRef, fetchMap } = useAsyncMap(toRef(() => props.map));

void fetchMap();
</script>

<template>
  <ul class="menu-list">
    <TreeMapItem
      v-for="[key, item] in mapRef"
      :key="key"
      :item-key="key"
      :item="item"
      :active-key
      :active-item
      @click="onClick"
    >
      <template #label="scoped">
        <slot :key="scoped.key" name="label" :item="scoped.item" />
      </template>

      <template
        v-if="!!slots.contextMenu"
        #contextMenu="{ item: contextItem, key: contextKey }"
      >
        <slot :key="contextKey" name="contextMenu" :item="contextItem" />
      </template>
    </TreeMapItem>
  </ul>
</template>

<style lang="scss" scoped>
.menu-list {
  --bulma-menu-nested-list-margin: 0.75em 0 0.75em 0.75em;
}
</style>
