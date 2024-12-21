<script setup lang="ts">
import MDButton from './MDButton.vue';
</script>

<template>
  <div class="grid">
    <MDButton type="elevated" label="elevated default" />

    <MDButton type="elevated" label="elevated hover" class="md-button_hover" />

    <MDButton type="elevated" disabled label="elevated disabled" />
  </div>
</template>

<style lang="scss" scoped>
.grid {
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
  gap: 16px;
  justify-content: center;
  align-items: center;
}
</style>
