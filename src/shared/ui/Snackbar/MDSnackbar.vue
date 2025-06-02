<script setup lang="ts">
import { MDButton, MDIconButton } from '../Button';
import MDSymbol from '../Icon/MDSymbol.vue';

const {} = defineProps<{
  text: string;
  actionLabel?: string;
}>();

const emit = defineEmits<{
  clickAction: [];
  clickClose: [];
}>();

const onClickAction = () => {
  emit('clickAction');
};

const onClickClose = () => {
  emit('clickClose');
};
</script>

<template>
  <div class="md md-snackbar">
    <div class="md-snackbar__text">
      {{ text }}
    </div>

    <MDButton
      v-if="actionLabel"
      color="text"
      class="md-snackbar__action"
      :label="actionLabel"
      @click="onClickAction"
    />

    <MDIconButton
      tooltip="close"
      class="md md-snackbar__close-button"
      @click="onClickClose"
    >
      <template #icon>
        <MDSymbol name="close" />
      </template>
    </MDIconButton>
  </div>
</template>

<style lang="css" scoped>
.md-snackbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  --md-container-color: var(--md-sys-color-inverse-surface);
  --md-content-color: var(--md-sys-color-inverse-on-surface);
  box-shadow: var(--md-sys-elevation-level3);
  border-radius: var(--md-sys-shape-corner-extra-small);
  padding: 4px 16px;

  &__text {
    font-family: var(--md-sys-typescale-body-medium-font);
    font-weight: var(--md-sys-typescale-body-medium-weight);
    font-size: var(--md-sys-typescale-body-medium-size);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    letter-spacing: var(--md-sys-typescale-body-medium-tracking);
  }

  &__close-button {
    --md-container-color: var(--md-sys-color-inverse-surface);
    --md-content-color: var(--md-sys-color-inverse-on-surface);
  }

  &__action {
    --md-content-color: var(--md-sys-color-inverse-primary);

    &:hover {
      --md-content-color: var(--md-sys-color-inverse-primary);
    }
  }
}
</style>
