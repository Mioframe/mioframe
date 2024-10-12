<script setup lang="ts">
import type {
  GDriveDirectory,
  GDriveFile,
  GDriveSpaces,
} from '../../shared/lib/googleDrive';
import TreeMap from '../../shared/ui/TreeMenu/TreeMap.vue';

defineProps<{
  gDriveDirectory: GDriveDirectory | GDriveSpaces;
  activeKey?: string;
  activeItem?: GDriveDirectory | GDriveFile;
  filter?: ([key, item]: [string, GDriveDirectory | GDriveFile]) => boolean;
}>();

const slots = defineSlots<{
  contextMenu(props: {
    key: string;
    item: GDriveDirectory | GDriveFile;
  }): unknown;
}>();

const emit = defineEmits<{
  click: [key: string, item: GDriveDirectory | GDriveFile];
}>();

const onClick = (key: string, item: GDriveDirectory | GDriveFile) => {
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
