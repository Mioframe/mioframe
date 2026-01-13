<script setup lang="ts">
/**
 * Отображение значения: "Глупый" компонент для красивого вывода дат, массивов, строк или чисел
 */

defineProps<{
  value: unknown;
}>();
</script>

<template>
  <div>
    {{ value }}
  </div>
</template>
