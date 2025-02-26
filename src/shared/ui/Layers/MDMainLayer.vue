<script setup lang="ts">
defineSlots<{
  navigation(): unknown;
  firstPane(): unknown;
}>();
</script>

<template>
  <main class="md-layer">
    <nav v-if="!!$slots.navigation" class="md-layer__navigation">
      <slot name="navigation" />
    </nav>

    <section class="md-layer__body body">
      <div class="body__first-pane">
        <slot name="firstPane" />
      </div>
    </section>
  </main>
</template>

<style scoped>
.md-layer {
  flex-grow: 1;
  display: flex;
  flex-direction: column-reverse;
  padding-left: 16px;
  padding-right: 16px;
  overflow: auto;
  --md-container-color: var(--md-sys-color-surface);

  &__navigation {
    flex-grow: 1;
    flex-shrink: 0;
  }

  &__body {
    flex-grow: 1;
    flex-shrink: 0;
    max-height: 100%;
  }
}

.body {
  display: flex;

  &__first-pane {
    display: flex;
    flex-direction: column;
    flex: 1 0;
  }
}
</style>
