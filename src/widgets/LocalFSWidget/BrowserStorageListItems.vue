<script setup lang="ts">
import { useBrowserStoragePersistence } from '@entity/browserStoragePersistence';
import { useBrowserStoragePersistenceFeedback } from '@feature/browserStoragePersistenceEnable';
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
const { showFeedback } = useBrowserStoragePersistenceFeedback();

const onClickNav = () => {
  emit('clickPath', props.name);
};

const onEnableStorage = async () => {
  const outcome = await requestPersistence();
  showFeedback(outcome);
};
</script>

<template>
  <MDListItem
    v-if="status === 'ordinary'"
    mode="single-action"
    label-text="Enable more reliable storage"
    :disabled="isRequesting"
    :line-count="3"
    @action="onEnableStorage"
  >
    <template #leading>
      <MDSymbol name="shield" />
    </template>
    <template #supportingText>
      Standard browser storage may be cleared under storage pressure. More reliable storage reduces
      that risk and does not replace backups.
    </template>
  </MDListItem>

  <MDListItem
    v-else-if="status === 'unsupported'"
    label-text="More reliable storage unavailable"
    :line-count="3"
  >
    <template #leading>
      <MDSymbol name="shield" />
    </template>
    <template #supportingText>
      This browser cannot enable more reliable storage here. You can continue, but keep backups for
      important data.
    </template>
  </MDListItem>

  <LocalFSDeviceFileListItem :name="name" :description="description" @click-path="onClickNav" />
</template>
