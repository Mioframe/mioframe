<script setup lang="ts" generic="P extends Record<string, { default: any }>">
defineSlots<{
  controllers: () => unknown;
  space: () => unknown;
}>();
</script>

<template>
  <div class="store">
    <div class="store__space">
      <slot name="space" />
    </div>

    <div class="store__controllers">
      <slot name="controllers" />
    </div>
  </div>
</template>

<style lang="css" scoped>
.store {
  display: flex;
  flex: 1 1;
  gap: 16px;

  &__controllers {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  &__space {
    display: block;
    overflow: auto;
    flex: 1 1;
    padding: 16px;

    background-color: var(--second);
    --first: rgb(from var(--md-content-color) r g b / 50%);
    --second: rgb(from var(--md-container-color) r g b / 50%);
    background-image:
      linear-gradient(45deg, var(--first) 25%, transparent 25%),
      linear-gradient(-45deg, var(--first) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--first) 75%),
      linear-gradient(-45deg, transparent 75%, var(--first) 75%);
    background-size: 20px 20px;
    background-position:
      0 0,
      0 10px,
      10px -10px,
      -10px 0px;
  }
}
</style>
