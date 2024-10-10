<script setup lang="ts">
import type { GDriveDirectory, GDriveFile } from '../../shared/lib/googleDrive';
import TreeMap from '../../shared/ui/TreeMenu/TreeMap.vue';

// todo: добавить фильтрацию по типам
// todo: добавить фичу создания директории

defineProps<{
  gDriveDirectory: GDriveDirectory;
  activeKey?: string;
  activeItem?: GDriveDirectory | GDriveFile;
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

// fixme: не работает раскрытие папок
</script>

<template>
  <div class="menu is-overflow-auto">
    <TreeMap :map="gDriveDirectory" :active-key :active-item @click="onClick">
      <template v-if="!!slots.contextMenu" #contextMenu="{ item, key }">
        <slot :key name="contextMenu" :item />
      </template>

      <template #label="{ key }">
        {{ key }}
      </template>
    </TreeMap>
  </div>
</template>
