<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const onPush = () => {
  void router.push('/detail/99?tab=updated#bottom');
};

const onBack = () => {
  router.back();
};

const onForward = () => {
  router.forward();
};
</script>

<template>
  <div data-testid="router-harness-regression">
    <p data-testid="router-harness-path">{{ route.path }}</p>
    <p data-testid="router-harness-query-tab">{{ route.query.tab }}</p>
    <p data-testid="router-harness-hash">{{ route.hash }}</p>
    <p data-testid="router-harness-param-id">{{ route.params.id }}</p>
    <RouterLink data-testid="router-harness-link" to="/">Back to root</RouterLink>
    <button data-testid="router-harness-push" type="button" @click="onPush">Push detail 99</button>
    <button data-testid="router-harness-back" type="button" @click="onBack">Back</button>
    <button data-testid="router-harness-forward" type="button" @click="onForward">Forward</button>
  </div>
</template>
