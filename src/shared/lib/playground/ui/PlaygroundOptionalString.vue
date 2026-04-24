<script setup lang="ts">
const value = defineModel<string | undefined>({
  set: (v) => {
    if (!v || v.length < 1) {
      return undefined;
    }
    return v;
  },
  get: (v) => v,
});

defineProps<{ label: string }>();
</script>

<template>
  <label>
    {{ label }}
    <input v-model="value" type="text" />
  </label>
</template>
