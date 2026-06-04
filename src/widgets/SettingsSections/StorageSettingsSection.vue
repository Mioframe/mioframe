<script setup lang="ts">
import { computed } from 'vue';
import { useBrowserStoragePersistence } from '@entity/browserStoragePersistence';
import { MDListContainer } from '@shared/ui/Lists';
import SettingsSection from './SettingsSection.vue';
import SettingsCheckboxListItem from './SettingsCheckboxListItem.vue';

const { status, isRequesting, requestPersistence } = useBrowserStoragePersistence();

const isChecked = computed(() => status.value === 'persistent');

// Persistent state is readonly (one-way capability), not disabled.
const isReadonly = computed(() => status.value === 'persistent');

const isDisabled = computed(
  () => status.value === 'unsupported' || status.value === 'checking' || isRequesting.value,
);

const supportingText = computed(() => {
  if (status.value === 'persistent') {
    return 'More reliable browser storage is enabled. This reduces the risk of automatic browser cleanup, but it does not replace backups.';
  }
  if (status.value === 'unsupported') {
    return 'This browser cannot enable more reliable storage here. You can continue, but keep backups for important data.';
  }
  return 'Ask the browser to reduce the risk of automatic cleanup for local Mioframe data. This does not replace backups.';
});

const onChange = () => {
  if (status.value === 'ordinary' && !isRequesting.value) {
    void requestPersistence();
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
        :readonly="isReadonly"
        :lines="2"
        @change="onChange"
      />
    </MDListContainer>
  </SettingsSection>
</template>
