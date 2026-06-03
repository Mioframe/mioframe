<script setup lang="ts">
import { useBrowserStoragePersistence } from '@entity/browserStoragePersistence';
import { MDListItem } from '@shared/ui/Lists';
import { MDSymbol } from '@shared/ui/Icon';
import LocalFSDeviceFileListItem from './LocalFSDeviceFileListItem.vue';

const props = defineProps<{
  name: string;
  description?: string | undefined;
}>();

const emit = defineEmits<{
  clickPath: [name: string];
}>();

const { status, isRequesting, requestPersistence } = useBrowserStoragePersistence();

const onClickNav = () => {
  emit('clickPath', props.name);
};

const onEnableStorage = () => {
  void requestPersistence();
};
</script>

<template>
  <MDListItem
    is="button"
    v-if="status === 'ordinary'"
    type="button"
    headline="Enable more reliable storage"
    :disabled="isRequesting"
    @click="onEnableStorage"
  >
    <template #leadingIcon>
      <MDSymbol name="shield" />
    </template>
    <template #supportingText>
      Standard browser storage is fine for trying Mioframe, but the browser may clear local data
      under storage pressure. More reliable storage reduces that risk and does not replace backups.
    </template>
  </MDListItem>

  <MDListItem
    is="div"
    v-else-if="status === 'unsupported'"
    headline="More reliable storage unavailable"
  >
    <template #leadingIcon>
      <MDSymbol name="shield" />
    </template>
    <template #supportingText>
      This browser cannot enable more reliable storage here. You can continue, but keep backups for
      important data.
    </template>
  </MDListItem>

  <LocalFSDeviceFileListItem :name="name" :description="description" @click-path="onClickNav" />
</template>
