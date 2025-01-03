<template>
  <div class="md-fab-container">
    <slot />
  </div>
</template>

<style scoped>
.md-fab-container {
  display: flex;
  flex-direction: column;
  pointer-events: none;
  padding-bottom: 16px;
  align-items: center;

  :deep() {
    > * {
      pointer-events: auto;
    }

    > .md-fab {
      margin-top: 16px;

      &:not(.md-fab_small) {
        margin-top: 24px;
      }
    }
  }
}
</style>
