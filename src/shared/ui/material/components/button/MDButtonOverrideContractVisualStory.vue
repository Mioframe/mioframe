<script setup lang="ts">
import MDButton from './MDButton.vue';

const ancestorOverrideStyle = {
  '--md-comp-button-filled-container-color': 'rgb(10 20 30)',
  '--md-comp-button-filled-label-text-color': 'rgb(250 250 250)',
};
</script>

<template>
  <div
    id="visual-md-button-override-contract"
    class="visual-checker-backdrop"
    :style="ancestorOverrideStyle"
  >
    <div class="visual-row">
      <MDButton
        data-testid="override-class-selector"
        class="override-contract-class"
        label="Class override"
        color="filled"
      />
      <MDButton data-testid="override-inherited" label="Inherited override" color="filled" />
    </div>
  </div>
</template>

<style scoped>
/*
 * A plain, unscoped-specificity CSS class (no inline style, no `!important`) proves the
 * `--md-comp-*` override contract: MDButton must not assign this public token's default directly
 * on its own `.md-button_color-filled` selector, or a class this ordinary could never win.
 */
.override-contract-class {
  --md-comp-button-filled-container-color: rgb(40 50 60);
}
</style>
