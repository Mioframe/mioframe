<script setup lang="ts">
defineProps<{
  headline: string;
  supportingText?: string;
  isButton?: boolean;
}>();

defineSlots<{
  leadingIcon: () => unknown;
  trailingIcon: () => unknown;
  leadingAvatarContainer: () => unknown;
}>();
</script>

<template>
  <component
    :is="isButton ? 'button' : 'li'"
    class="md-list-item"
    :type="isButton ? 'button' : undefined"
  >
    <span v-if="!!$slots.leadingIcon" class="md-list-item__leading-icon">
      <slot name="leadingIcon" />
    </span>

    <span
      v-if="!!$slots.leadingAvatarContainer"
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

    <span v-if="!!$slots.trailingIcon" class="md-list-item__trailing-icon">
      <slot name="trailingIcon" />
    </span>
  </component>
</template>

<style scoped>
.md-list-item {
  --md-list-item-horizontal-gap: 16px;
  --md-list-item-min-height: 56px;

  display: flex;
  padding: 8px var(--md-list-item-horizontal-gap);
  align-items: center;
  --md-container-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  font-family: var(--md-sys-typescale-body-large-font);
  min-height: var(--md-list-item-min-height);
  box-sizing: border-box;
  flex-grow: 1;
  text-align: start;

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
    display: block;
    width: 40px;
    height: 40px;
  }

  &__trailing-icon {
    margin-left: var(--md-list-item-horizontal-gap);

    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
