<script setup lang="ts">
import { useLocalSettings } from '@entity/localSettings';
import { MDIconButton } from '@shared/ui/Button';

const { settings } = useLocalSettings();

const onDismiss = () => {
  settings.value.hideStarterWidget = true;
};
</script>

<template>
  <MDIconButton tooltip="Hide starter examples" md-symbol-name="close" @click="onDismiss" />
</template>
