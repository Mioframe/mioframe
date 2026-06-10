<script setup lang="ts">
import { computed } from 'vue';
import { MDListItem } from '@shared/ui/Lists';

const props = defineProps<{
  hasRetainedPrompt: boolean;
}>();

const emit = defineEmits<{
  install: [];
}>();

const actionLabel = computed(() => (props.hasRetainedPrompt ? 'Install' : 'How to install'));

const onClickInstall = () => {
  emit('install');
};
</script>

<template>
  <MDListItem
    is="button"
    class="pwa-install-settings-list-item"
    type="button"
    headline="Install app"
    @click="onClickInstall"
  >
    <template #supportingText>{{ actionLabel }}</template>
  </MDListItem>
</template>
