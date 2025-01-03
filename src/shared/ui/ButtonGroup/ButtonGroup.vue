<template>
  <div class="buttons has-addons is-flex-wrap-nowrap">
    <slot />
  </div>
</template>

<style scoped>
.buttons.has-addons {
  :deep() {
    > .button {
      width: auto;
      box-shadow: none;
    }
  }
}
</style>
