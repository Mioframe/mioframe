<script setup lang="ts">
import { ref } from 'vue';
import MDButton from './MDButton.vue';

const clickCount = ref(0);

const onClick = () => {
  clickCount.value += 1;
};
</script>

<template>
  <div id="visual-md-button-target-hit" class="visual-checker-backdrop">
    <MDButton label="OK" size="extra-small" @click="onClick" />

    <output id="visual-md-button-target-hit-count">{{ clickCount }}</output>
  </div>
</template>
