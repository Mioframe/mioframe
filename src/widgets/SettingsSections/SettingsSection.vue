<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
}>();

defineSlots<{
  default: () => unknown;
}>();

const titleId = computed(
  () => `settings-section-${props.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
);
</script>

<template>
  <section class="settings-section" :aria-labelledby="titleId">
    <h2 :id="titleId" class="settings-section__title">{{ title }}</h2>
    <slot />
  </section>
</template>

<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;
}

.settings-section__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-title-small-font);
  font-size: var(--md-sys-typescale-title-small-size);
  font-weight: var(--md-sys-typescale-title-small-weight);
  letter-spacing: var(--md-sys-typescale-title-small-tracking);
  line-height: var(--md-sys-typescale-title-small-line-height);
}
</style>
