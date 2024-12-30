<script setup lang="ts">
import MDButton from './MDButton.vue';
import MDFab from './MDFab.vue';
import MDFabContainer from './MDFabContainer.vue';

const buttonTypes = [
  'elevated',
  'filled',
  'tonal',
  'outlined',
  'text',
] as const;

const fabTypes = ['primary', 'branded', 'secondary', 'tertiary'] as const;
</script>

<template>
  <div class="grid">
    <div v-for="type in buttonTypes" :key="`buttonTypes${type}`" class="grid">
      <MDButton :type :label="`${type} enabled`" />

      <MDButton :type disabled :label="`${type} disable`" />

      <MDButton :type :label="`${type} hovered`" class="md-container_hover" />

      <MDButton
        :type
        :label="`${type} focused`"
        class="md-button_focused md-container_focused"
      />

      <MDButton :type :label="`${type} pressed`" class="md-container_press" />

      <MDButton :type :label="`${type} icon`">
        <template #icon> <i class="fa-solid fa-star" /> </template>
      </MDButton>
    </div>

    <MDFabContainer v-for="type in fabTypes" :key="`fabTypes${type}`">
      <MDFab size="small" :type />

      <MDFab :type />

      <MDFab size="large" :type />
    </MDFabContainer>
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
