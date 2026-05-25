<script setup lang="ts">
import { MDButton } from '../Button';

const props = defineProps<{
  label: string;
  path: string;
}>();

const emit = defineEmits<{
  click: [path: string];
}>();

const onClick = () => {
  emit('click', props.path);
};
</script>

<template>
  <MDButton :label="label" color="text" class="md-navigation-path__item" @click="onClick" />
</template>
