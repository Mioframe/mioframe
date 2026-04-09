<script setup lang="ts" generic="O extends readonly unknown[]">

defineProps<{ label: string; options: O }>();

const value = defineModel<O[number]>({ required: true });
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
