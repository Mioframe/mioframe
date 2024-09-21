<template>
  <div class="sliding-panel">
    <div class="sliding-panel__tray">
      <div class="sliding-panel__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sliding-panel {
  --sliding-panel-min-height: 100px;
  --sliding-panel-background: transparent;
  height: var(--sliding-panel-min-height);

  &__tray {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
    overflow-y: auto;
    padding-top: calc(100vh - var(--sliding-panel-min-height));
    scrollbar-width: none;
  }

  &__content {
    background: var(--sliding-panel-background);
    pointer-events: all;
  }
}
</style>
