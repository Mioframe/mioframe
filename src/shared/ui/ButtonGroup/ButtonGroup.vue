<template>
  <div class="buttons has-addons is-flex-wrap-nowrap">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.buttons.has-addons {
  :deep() {
    > .button {
      width: auto;
    }
  }
}
</style>
