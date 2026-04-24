<script setup lang="ts" generic="O extends readonly unknown[]">
const value = defineModel<O[number]>({ required: true });

defineProps<{ label: string; options: O }>();
</script>

<template>
  <label>
    {{ label }}
    <select v-model="value">
      <option v-for="(option, i) in options" :key="i" :value="option">
        {{ String(option) }}
      </option>
    </select>
  </label>
</template>
