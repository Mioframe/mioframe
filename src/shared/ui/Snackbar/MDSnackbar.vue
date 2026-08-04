<script setup lang="ts">
import { MDButton } from '@shared/ui/material';
import { MDIconButton } from '../Button';
import MDSymbol from '../Icon/MDSymbol.vue';

defineProps<{
  text: string;
  actionLabel?: string | undefined;
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
      color="standard"
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
    --md-comp-icon-button-standard-icon-color: var(--md-sys-color-inverse-on-surface);
    --md-comp-icon-button-standard-hovered-icon-color: var(--md-sys-color-inverse-on-surface);
    --md-comp-icon-button-standard-focused-icon-color: var(--md-sys-color-inverse-on-surface);
    --md-comp-icon-button-standard-pressed-icon-color: var(--md-sys-color-inverse-on-surface);
    --md-comp-icon-button-standard-hovered-state-layer-color: var(
      --md-sys-color-inverse-on-surface
    );
    --md-comp-icon-button-standard-focused-state-layer-color: var(
      --md-sys-color-inverse-on-surface
    );
    --md-comp-icon-button-standard-pressed-state-layer-color: var(
      --md-sys-color-inverse-on-surface
    );
  }

  &__action {
    --md-comp-button-text-label-text-color: var(--md-sys-color-inverse-primary);
    --md-comp-button-text-hovered-label-text-color: var(--md-sys-color-inverse-primary);
    --md-comp-button-text-focused-label-text-color: var(--md-sys-color-inverse-primary);
    --md-comp-button-text-pressed-label-text-color: var(--md-sys-color-inverse-primary);
    --md-comp-button-text-hovered-state-layer-color: var(--md-sys-color-inverse-primary);
    --md-comp-button-text-focused-state-layer-color: var(--md-sys-color-inverse-primary);
    --md-comp-button-text-pressed-state-layer-color: var(--md-sys-color-inverse-primary);
  }
}
</style>
