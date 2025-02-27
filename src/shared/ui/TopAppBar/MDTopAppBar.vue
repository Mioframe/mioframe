<script lang="ts" setup>
defineProps<{
  headline: string;
}>();

defineSlots<{
  leadingNavigation(): unknown;
  trailingInteractive(): unknown;
}>();
</script>

<template>
  <div class="md-top-app-bar">
    <slot name="leadingNavigation" />

    <span class="md-top-app-bar__headline">
      {{ headline }}
    </span>

    <div
      v-if="!!$slots.trailingInteractive"
      class="md-top-app-bar__trailing-interactive"
    >
      <slot name="trailingInteractive" />
    </div>
  </div>
</template>

<style lang="css" scoped>
.md-top-app-bar {
  display: flex;

  &__headline {
    flex: 1;
  }
}
</style>
