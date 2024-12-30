<script setup lang="ts">
defineSlots<{
  navigation(): unknown;
  firstPane(): unknown;
}>();
</script>

<template>
  <main class="layer">
    <nav v-if="!!$slots.navigation" class="layer__navigation">
      <slot name="navigation" />
    </nav>

    <section class="layer__body body">
      <div class="body__first-pane">
        <slot name="firstPane" />
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
@use '../../lib/md';

.layer {
  flex-grow: 1;
  display: flex;
  flex-direction: column-reverse;
  padding-left: md.dp(16);
  padding-right: md.dp(16);

  &__navigation {
    flex-grow: 1;
    flex-shrink: 0;
  }

  &__body {
    flex-grow: 1;
    flex-shrink: 0;
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
