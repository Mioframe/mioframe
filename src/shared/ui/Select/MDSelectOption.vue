<script setup lang="ts" generic="Value extends string | number = string | number">
import { computed, toRefs } from 'vue';
import MDMenuItem from '../Menu/MDMenuItem.vue';
import type { MenuButtonDescription } from '../Menu';
import { setupOption } from './provideOptions';

const props = defineProps<{
  value: Value;
  label: string;
}>();

const { label, value } = toRefs(props);

const item = computed((): MenuButtonDescription => ({ key: props.value, label: props.label }));

const { onClickOption } = setupOption(value, label);
</script>

<template>
  <MDMenuItem :item="item" item-role="option" @click="onClickOption" />
</template>
