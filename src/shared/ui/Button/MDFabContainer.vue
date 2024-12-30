<template>
  <div class="md-fab-container">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@use '../../lib/md';

.md-fab-container {
  display: flex;
  flex-direction: column;
  pointer-events: none;
  padding-bottom: md.dp(16);
  align-items: center;

  :deep() {
    > * {
      pointer-events: auto;
    }

    > .md-fab {
      margin-top: md.dp(16);

      &:not(.md-fab_small) {
        margin-top: md.dp(24);
      }
    }
  }
}
</style>
