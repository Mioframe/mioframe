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
    is="button"
    v-if="status === 'ordinary'"
    type="button"
    headline="Enable more reliable storage"
    :disabled="isRequesting"
    :lines="2"
    @click="onEnableStorage"
  >
    <template #leadingIcon>
      <MDSymbol name="shield" />
    </template>
    <template #supportingText>
      Standard browser storage may be cleared under storage pressure. More reliable storage reduces
      that risk and does not replace backups.
    </template>
  </MDListItem>

  <MDListItem
    is="div"
    v-else-if="status === 'unsupported'"
    headline="More reliable storage unavailable"
    :lines="2"
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
