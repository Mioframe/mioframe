<script setup lang="ts">
import MDIconButton from '../MDIconButton.vue';
import type { ArrayValues } from 'type-fest';
import { ref } from 'vue';

const states = [
  undefined,
  'md-state_hover',
  'md-state_disabled',
  'md-state_focused',
  'md-state_pressed',
  'md-state_dragged',
] as const;
const types = ['default', 'toggle'] as const;
const shapes = ['round', 'square'] as const;
const widths = ['narrow', 'default', 'wide'] as const;
const sizes = [
  'extra-small',
  'small',
  'medium',
  'large',
  'extra-large',
] as const;
const colors = ['filled', 'tonal', 'outlined', 'standard'] as const;

const color = ref<ArrayValues<typeof colors>>(colors[0]);
const size = ref<ArrayValues<typeof sizes>>(sizes[0]);
const type = ref<ArrayValues<typeof types>>(types[0]);
const width = ref<ArrayValues<typeof widths>>(widths[0]);
const shape = ref<ArrayValues<typeof shapes>>(shapes[0]);
const selected = ref<boolean>(false);
const progress = ref<number>(0);
</script>

<template>
  <section>
    <section>
      <select v-model="color">
        <option v-for="value in colors" :key="value">
          {{ value }}
        </option>
      </select>

      <select v-model="size">
        <option v-for="value in sizes" :key="value">
          {{ value }}
        </option>
      </select>

      <select v-model="width">
        <option v-for="value in widths" :key="value">
          {{ value }}
        </option>
      </select>

      <select v-model="shape">
        <option v-for="value in shapes" :key="value">
          {{ value }}
        </option>
      </select>

      <select v-model="type">
        <option v-for="value in types" :key="value">
          {{ value }}
        </option>
      </select>

      <input v-model="selected" type="checkbox" />

      <input
        v-model.number="progress"
        type="range"
        min="0"
        max="1"
        step="0.01"
      />
    </section>

    <MDIconButton
      v-for="state in states"
      :key="state"
      :tooltip="`${state} ${type} ${selected} ${shape} ${width} ${size} ${color}`"
      :class="state"
      :type
      :selected
      :shape
      :width
      :size
      :color
      :loading="progress === 1 ? true : progress"
      md-symbol-name="settings"
    />
  </section>
</template>

<style lang="css" scoped>
section {
  display: flex;
  width: 100%;
  flex-grow: 1;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 2step;
  margin-top: 2step;
  padding-left: 2step;
}
</style>
