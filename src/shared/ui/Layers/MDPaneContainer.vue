<template>
  <div class="md md-pane-container">
    <slot />
  </div>
</template>

<style lang="css" scoped>
.md-pane-container {
  --md-pane-container-shape: 16px;

  position: relative;
  flex-grow: 1;
  flex-shrink: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border-radius: var(--md-pane-container-shape);
  overflow-y: auto;
  --md-container-color: var(--md-sys-color-surface);
  --md-content-color: var(--md-sys-color-on-surface);
}
</style>
