<script setup lang="ts">
import { MDState } from '../State';
import { computed } from 'vue';

const props = defineProps<{
  headline: string;
  supportingText?: string | undefined;
  lines?: 1 | 2 | 3 | undefined;
  is?: 'button' | 'a' | 'div' | 'li' | undefined;
  type?: 'button' | 'submit' | 'reset' | false | undefined;
  itemRole?: string | undefined;
  disabled?: boolean | undefined;
  draggable?: boolean | undefined;
}>();

const emit = defineEmits<{
  click: [e: MouseEvent];
  keydown: [e: KeyboardEvent];
}>();

const slots = defineSlots<{
  leadingIcon: () => unknown;
  trailingIcon: () => unknown;
  leadingAvatarContainer: () => unknown;
  supportingText: () => unknown;
}>();

const itemTag = computed<'button' | 'a' | 'div' | 'li'>(() => props.is ?? 'div');
const isNativeInteractive = computed(() => itemTag.value === 'button' || itemTag.value === 'a');
const resolvedRole = computed(() => {
  if (isNativeInteractive.value) {
    return undefined;
  }

  return 'listitem';
});
const stateAttrs = computed(() => ({
  type: itemTag.value === 'button' ? props.type || 'button' : undefined,
  role: props.itemRole ?? resolvedRole.value ?? null,
}));
const supportingTextClass = computed(() => ({
  'md-list-item__supporting-text--one-line': props.lines !== 2 && props.lines !== 3,
  'md-list-item__supporting-text--two-lines': props.lines === 2,
  'md-list-item__supporting-text--three-lines': props.lines === 3,
}));

const onClick = (e: MouseEvent) => {
  if (props.disabled) {
    return;
  }

  if (isNativeInteractive.value) {
    emit('click', e);
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (props.disabled) {
    return;
  }

  if (isNativeInteractive.value) {
    emit('keydown', e);
  }
};
</script>

<template>
  <MDState
    :is="itemTag"
    class="md-list-item"
    :draggable="props.draggable"
    :disabled="props.disabled"
    :disable-ripple="props.disabled || itemTag === 'li'"
    v-bind="stateAttrs"
    @click="onClick"
    @keydown="onKeydown"
  >
    <span v-if="!!slots.leadingIcon" class="md-list-item__leading-icon">
      <slot name="leadingIcon" />
    </span>

    <span v-if="!!slots.leadingAvatarContainer" class="md-list-item__leading-avatar-container">
      <slot name="leadingAvatarContainer" />
    </span>

    <div class="md-list-item__body">
      <span class="md-list-item__headline">{{ headline }}</span>

      <div
        v-if="supportingText || !!slots.supportingText"
        class="md-list-item__supporting-text"
        :class="supportingTextClass"
      >
        <slot name="supportingText">{{ supportingText }}</slot>
      </div>
    </div>

    <span v-if="!!slots.trailingIcon" class="md-list-item__trailing-icon">
      <slot name="trailingIcon" />
    </span>
  </MDState>
</template>

<style scoped>
.md-list-item {
  --horizontal-gap: var(--md-list-item-horizontal-gap, 16px);
  --min-height: var(
    --md-list-item-min-height,
    v-bind('lines === 3 ? "88px" : lines === 2 ? "72px" : "56px"')
  );
  --border-radius: var(--md-list-item-border-radius, 0px);

  --md-container-color: var(--md-list-item-container-color, var(--md-sys-color-surface));
  --md-content-color: var(--md-list-item-content-color, var(--md-sys-color-on-surface));

  --md-target-offset: 0px;
  --md-focus-indicator-offset: -2px;

  --md-state-display: flex;
  --md-state-padding-top: 8px;
  --md-state-padding-right: var(--horizontal-gap);
  --md-state-padding-bottom: 8px;
  --md-state-padding-left: var(--horizontal-gap);
  --md-state-align-items: center;
  --md-state-min-height: var(--min-height);
  --md-state-box-sizing: border-box;
  --md-state-border-radius: var(--border-radius);
  --md-state-border-width: 0;
  font-family: var(--md-sys-typescale-body-large-font);
  text-align: start;

  &:first-child {
    border-top-right-radius: max(var(--border-radius), var(--md-list-container-border-radius, 0px));
    border-top-left-radius: max(var(--border-radius), var(--md-list-container-border-radius, 0px));
  }

  &:last-child {
    border-bottom-right-radius: max(
      var(--border-radius),
      var(--md-list-container-border-radius, 0px)
    );
    border-bottom-left-radius: max(
      var(--border-radius),
      var(--md-list-container-border-radius, 0px)
    );
  }

  &__leading-icon {
    display: flex;
    min-width: 24px;
    min-height: 24px;

    color: var(--md-sys-color-on-surface-variant);
  }

  &__body {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-width: 0;

    .md-list-item__leading-avatar-container ~ &,
    .md-list-item__leading-icon ~ & {
      margin-left: var(--horizontal-gap);
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
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;

    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-medium-font);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    font-size: var(--md-sys-typescale-body-medium-size);
    letter-spacing: var(--md-sys-typescale-body-medium-tracking);
    font-weight: var(--md-sys-typescale-body-medium-weight);
  }

  &__supporting-text--one-line {
    -webkit-line-clamp: 1;
  }

  &__supporting-text--two-lines {
    -webkit-line-clamp: 2;
  }

  &__supporting-text--three-lines {
    -webkit-line-clamp: 3;
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
    margin-left: var(--horizontal-gap);

    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
