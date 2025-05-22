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

const buttonSizes = [
  'extra-small',
  'small',
  'medium',
  'large',
  'extra-large',
] as const;
</script>

<template>
  <div class="grid">
    <div v-for="color in buttonTypes" :key="`buttonTypes${color}`" class="grid">
      <MDButton :color :label="`${color} enabled`" />

      <MDButton :color disabled :label="`${color} disable`" />

      <MDButton :color :label="`${color} hovered`" class="md-state_hover" />

      <MDButton :color :label="`${color} focused`" class="md-state_focused" />

      <MDButton :color :label="`${color} pressed`" class="md-state_pressed" />

      <MDButton :color :label="`${color} icon`">
        <template #icon> <i class="fa-solid fa-star" /> </template>
      </MDButton>

      <MDButton :color label="loading" loading />

      <MDButton :color label="unselected" type="toggle" />

      <MDButton :color label="selected" type="toggle" selected />
    </div>

    <div class="grid">
      <MDButton
        v-for="size in buttonSizes"
        :key="size"
        :size
        :label="`size ${size}`"
      />
    </div>

    <div class="grid">
      <MDButton
        v-for="size in buttonSizes"
        :key="size"
        :size
        :label="`size ${size}`"
        shape="square"
      />
    </div>

    <MDFabContainer v-for="type in fabTypes" :key="`fabTypes${type}`">
      <MDFab tooltip="small" size="small" :type />

      <MDFab tooltip="default" :type />

      <MDFab tooltip="large" size="large" :type />

      <MDFab tooltip="small loading" size="small" :type loading />

      <MDFab tooltip="loading" size="large" :type loading />
    </MDFabContainer>
  </div>
</template>

<style scoped>
.grid {
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
  gap: 16px;
  justify-content: center;
  align-items: center;
}
</style>
