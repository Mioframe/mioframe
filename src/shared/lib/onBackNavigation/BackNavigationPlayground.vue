<script setup lang="ts">
import { PlaygroundStory } from '../playground';
import { MDButton } from '@shared/ui/Button';
import { isNumber } from 'es-toolkit/compat';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { onBackNavigation } from './main';

const router = useRouter();

const currentRoute = useRoute();

const currentStep = computed(() => {
  const step = currentRoute.query.step;
  if (isNumber(step)) {
    return step;
  }
  return 0;
});

const goPlusOne = async () => {
  await router.push({
    query: {
      ...currentRoute.query,
      step: currentStep.value + 1,
    },
  });
};

onBackNavigation(() => {
  console.log('⬅️ BAAAAACK');
  return false;
});
</script>

<template>
  <PlaygroundStory>
    <template #space>
      <pre class="md">{{ currentStep }}</pre>

      <MDButton label="back" @click="router.back()" />

      <MDButton label="forward" @click="router.forward()" />

      <MDButton label="query +1" @click="goPlusOne" />

      <pre class="md">{{ currentRoute }}</pre>
    </template>
  </PlaygroundStory>
</template>
