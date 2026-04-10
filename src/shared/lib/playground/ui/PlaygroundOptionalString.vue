<script setup lang="ts">
defineProps<{ label: string }>();

const value = defineModel<string | undefined>({
  set: (v) => {
    if (!v || v.length < 1) {
      return undefined;
    }
    return v;
  },
  get: (v) => v,
});
</script>

<template>
  <label>
    {{ label }}
    <input v-model="value" type="text" />
  </label>
</template>
