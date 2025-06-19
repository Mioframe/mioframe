<script setup lang="ts">
import { MDState } from '../State';

const { tag = 'li' } = defineProps<{
  headline: string;
  supportingText?: string;
  tag?: 'div' | 'button' | 'li' | 'a';
  draggable?: boolean;
}>();

const slots = defineSlots<{
  leadingIcon: () => unknown;
  trailingIcon: () => unknown;
  leadingAvatarContainer: () => unknown;
}>();

const emit = defineEmits<{
  click: [e: MouseEvent];
}>();

const onClick = (e: MouseEvent) => {
  if (['button', 'a'].includes(tag)) {
    emit('click', e);
  }
};
</script>

<template>
  <MDState
    :is="tag"
    class="md md-list-item"
    :draggable="draggable ? 'true' : undefined"
    @click="onClick"
  >
    <span v-if="!!slots.leadingIcon" class="md-list-item__leading-icon">
      <slot name="leadingIcon" />
    </span>

    <span
      v-if="!!slots.leadingAvatarContainer"
      class="md-list-item__leading-avatar-container"
    >
      <slot name="leadingAvatarContainer" />
    </span>

    <div class="md-list-item__body">
      <span class="md-list-item__headline">{{ headline }}</span>

      <span v-if="supportingText" class="md-list-item__supporting-text">
        {{ supportingText }}
      </span>
    </div>

    <span v-if="!!slots.trailingIcon" class="md-list-item__trailing-icon">
      <slot name="trailingIcon" />
    </span>
  </MDState>
</template>

<style scoped>
.md-list-item {
  --md-list-item-horizontal-gap: 16px;
  --md-list-item-min-height: 56px;
  --md-list-item-border-radius: 0px;
  --md-target-offset: 0px;
  --md-focus-indicator-offset: 0px;

  display: flex;
  padding: 8px var(--md-list-item-horizontal-gap);
  align-items: center;
  --md-container-color: var(--md-sys-color-surface);
  --md-content-color: var(--md-sys-color-on-surface);
  font-family: var(--md-sys-typescale-body-large-font);
  min-height: var(--md-list-item-min-height);
  box-sizing: border-box;
  text-align: start;
  border-radius: var(--md-list-item-border-radius);
  border-width: 0;

  &:first-child {
    border-top-right-radius: max(
      var(--md-list-item-border-radius),
      var(--md-list-container-border-radius, 0px)
    );
    border-top-left-radius: max(
      var(--md-list-item-border-radius),
      var(--md-list-container-border-radius, 0px)
    );
  }
  &:last-child {
    border-bottom-right-radius: max(
      var(--md-list-item-border-radius),
      var(--md-list-container-border-radius, 0px)
    );
    border-bottom-left-radius: max(
      var(--md-list-item-border-radius),
      var(--md-list-container-border-radius, 0px)
    );
  }

  &__leading-icon {
    display: block;
    width: 24px;
    height: 24px;

    color: var(--md-sys-color-on-surface-variant);
  }

  &__body {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow: auto;

    .md-list-item__leading-avatar-container ~ &,
    .md-list-item__leading-icon ~ & {
      margin-left: var(--md-list-item-horizontal-gap);
    }
  }

  &__headline {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    font-size: var(--md-sys-typescale-body-large-size);
    line-height: var(--md-sys-typescale-body-large-line-height);
    letter-spacing: var(--md-sys-typescale-body-large-tracking);
    font-weight: var(--md-sys-typescale-body-large-weight);
  }

  &__supporting-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-medium-font);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    font-size: var(--md-sys-typescale-body-medium-size);
    letter-spacing: var(--md-sys-typescale-body-medium-tracking);
    font-weight: var(--md-sys-typescale-body-medium-weight);
  }

  &__leading-avatar-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    overflow: hidden;
    flex-shrink: 0;
  }

  &__trailing-icon {
    margin-left: var(--md-list-item-horizontal-gap);

    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
