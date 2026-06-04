<script setup lang="ts">
import { watch } from 'vue';
import { useBrowserStoragePersistence } from '@entity/browserStoragePersistence';
import { MDListItem } from '@shared/ui/Lists';
import { MDSymbol } from '@shared/ui/Icon';
import { useSnackbar } from '@shared/ui/Snackbar';
import LocalFSDeviceFileListItem from './LocalFSDeviceFileListItem.vue';

const props = defineProps<{
  name: string;
  description?: string | undefined;
}>();

const emit = defineEmits<{
  clickPath: [name: string];
}>();

const { status, isRequesting, lastRequestOutcome, requestPersistence } =
  useBrowserStoragePersistence();
const { addSnackbar } = useSnackbar();

const onClickNav = () => {
  emit('clickPath', props.name);
};

const onEnableStorage = () => {
  void requestPersistence();
};

watch(lastRequestOutcome, (outcome) => {
  if (outcome === 'enabled') {
    addSnackbar({ text: 'More reliable browser storage enabled.' });
  } else if (outcome === 'not-enabled') {
    addSnackbar({
      text: 'The browser did not enable more reliable storage. You can continue using standard browser storage, but keep backups.',
    });
  } else if (outcome === 'failed') {
    addSnackbar({
      text: 'More reliable storage could not be enabled in this browser. You can continue using standard browser storage, but keep backups.',
    });
  }
});
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
      Standard browser storage is fine for trying Mioframe, but the browser may clear local data
      under storage pressure. More reliable storage reduces that risk and does not replace backups.
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
