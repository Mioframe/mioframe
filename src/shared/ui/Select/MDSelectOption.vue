<script setup lang="ts">
import { computed, toRefs } from 'vue';
import MDMenuItem from '../Menu/MDMenuItem.vue';
import type { MenuButtonDescription } from '../Menu';
import { setupOption } from './provideOptions';

const props = defineProps<{
  value: string | number;
  label: string;
}>();

const { label, value } = toRefs(props);

const item = computed(
  (): MenuButtonDescription => ({ key: props.value, label: props.label }),
);

const { onClickOption } = setupOption(value, label);
</script>

<template>
  <MDMenuItem :item="item" role="option" @click="onClickOption" />
</template>
