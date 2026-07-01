<script setup lang="ts">
import { ref } from 'vue';
import MDCard from './MDCard.vue';

const buttonActionCount = ref(0);
const linkActionCount = ref(0);
const disabledLinkActionCount = ref(0);

const onButtonAction = () => {
  buttonActionCount.value += 1;
};

const onLinkAction = () => {
  linkActionCount.value += 1;
};

const onDisabledLinkAction = () => {
  disabledLinkActionCount.value += 1;
};
</script>

<template>
  <div class="md-card-action-story visual-row">
    <div class="md-card-action-story__cell">
      <MDCard
        mode="button"
        variant="elevated"
        class="md-card-action-story__card"
        data-testid="md-card-button-action"
        @action="onButtonAction"
      >
        Tap this whole card
      </MDCard>
      <output data-testid="md-card-button-action-count">{{ buttonActionCount }}</output>
    </div>

    <div class="md-card-action-story__cell">
      <MDCard
        mode="link"
        href="#md-card-link-action-target"
        variant="outlined"
        class="md-card-action-story__card"
        data-testid="md-card-link-action"
        @action="onLinkAction"
      >
        Open Material 3 cards docs
      </MDCard>
      <output data-testid="md-card-link-action-count">{{ linkActionCount }}</output>
    </div>

    <div class="md-card-action-story__cell">
      <MDCard
        mode="link"
        href="/unreachable"
        variant="outlined"
        disabled
        class="md-card-action-story__card"
        data-testid="md-card-disabled-link-action"
        @action="onDisabledLinkAction"
      >
        Disabled link card
      </MDCard>
      <output data-testid="md-card-disabled-link-action-count">
        {{ disabledLinkActionCount }}
      </output>
    </div>
  </div>
</template>

<style scoped>
.md-card-action-story {
  &__cell {
    display: flex;
    flex-direction: column;
    gap: 8dp;
  }

  &__card {
    width: 220dp;
  }
}
</style>
