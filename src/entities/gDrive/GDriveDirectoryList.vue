<script
  setup
  lang="ts"
  generic="
    O extends object,
    K extends string | number,
    T extends AsyncMap<K, T> | O
  "
>
import type { AsyncMap } from '@shared/ui/TreeMenu/useAsyncMap';
import TreeMap from '../../shared/ui/TreeMenu/TreeMap.vue';

defineProps<{
  gDriveDirectory: AsyncMap<K, T>;
  activeKey?: K;
  activeItem?: T;
  filter?: ([key, item]: [K, T]) => boolean;
}>();

const slots = defineSlots<{
  contextMenu(props: { key: K; item: T }): unknown;
}>();

const emit = defineEmits<{
  click: [key: K, item: T];
}>();

const onClick = (key: K, item: T) => {
  emit('click', key, item);
};
</script>

<template>
  <div class="menu is-overflow-auto">
    <TreeMap
      :map="gDriveDirectory"
      :active-key
      :active-item
      :filter
      @click="onClick"
    >
      <template v-if="!!slots.contextMenu" #contextMenu="{ item, key }">
        <slot :key name="contextMenu" :item />
      </template>

      <template #label="{ key }">
        {{ key }}
      </template>

      <template #icon="{ item, listOpen, loading }">
        <i v-if="loading" class="fa-solid fa-spinner fa-spin-pulse" />

        <i v-else-if="'get' in item && !listOpen" class="fa-solid fa-folder" />

        <i
          v-else-if="'get' in item && listOpen"
          class="fa-regular fa-folder-open"
        />
      </template>
    </TreeMap>
  </div>
</template>
