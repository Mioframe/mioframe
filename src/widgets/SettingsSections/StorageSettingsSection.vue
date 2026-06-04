<script setup lang="ts">
import { computed } from 'vue';
import { useBrowserStoragePersistence } from '@entity/browserStoragePersistence';
import { useBrowserStoragePersistenceFeedback } from '@feature/browserStoragePersistenceEnable';
import { MDListContainer } from '@shared/ui/Lists';
import SettingsSection from './SettingsSection.vue';
import SettingsCheckboxListItem from './SettingsCheckboxListItem.vue';

const { status, isRequesting, requestPersistence } = useBrowserStoragePersistence();
const { showFeedback } = useBrowserStoragePersistenceFeedback();

const isLoading = computed(() => status.value === 'checking' || isRequesting.value);

const isChecked = computed(() => status.value === 'persistent');

const isDisabled = computed(
  () =>
    status.value === 'checking' ||
    status.value === 'persistent' ||
    status.value === 'unsupported' ||
    isRequesting.value,
);

const supportingText = computed(() => {
  if (status.value === 'persistent') {
    return 'More reliable browser storage is enabled. It can be changed from browser site settings. This does not replace backups.';
  }
  if (status.value === 'unsupported') {
    return 'This browser cannot enable more reliable storage here. You can continue, but keep backups.';
  }
  if (status.value === 'checking') {
    return 'Checking browser storage reliability…';
  }
  if (isRequesting.value) {
    return 'Requesting more reliable browser storage…';
  }
  return 'Ask the browser to reduce automatic cleanup risk for local Mioframe data. This does not replace backups.';
});

const onChange = async () => {
  if (status.value === 'ordinary' && !isRequesting.value) {
    const outcome = await requestPersistence();
    showFeedback(outcome);
  }
};
</script>

<template>
  <SettingsSection title="Storage">
    <MDListContainer is="div">
      <SettingsCheckboxListItem
        headline="More reliable browser storage"
        :supporting-text="supportingText"
        :checked="isChecked"
        :disabled="isDisabled"
        :loading="isLoading"
        :lines="2"
        @change="onChange"
      />
    </MDListContainer>
  </SettingsSection>
</template>
