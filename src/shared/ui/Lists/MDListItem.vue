<script setup lang="ts" generic="Is extends 'button' | 'a' | 'div' | 'li' = 'div'">
import { computed, useTemplateRef } from 'vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';

const {
  is = 'div',
  disabled,
  itemRole,
} = defineProps<{
  headline: string;
  supportingText?: string | undefined;
  is?: Is | undefined;
  type?: (Is extends 'button' ? 'button' | 'submit' | 'reset' : false) | undefined;
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

const onClick = (e: MouseEvent) => {
  if (disabled) {
    return;
  }

  if (['button', 'a'].includes(is)) {
    emit('click', e);
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (disabled) {
    return;
  }

  if (['button', 'a'].includes(is)) {
    emit('keydown', e);
  }
};

const hostEl = useTemplateRef<HTMLElement>('hostEl');
const showVisualState = computed(() => !disabled);
const { hover, focused, durationPressedState } = useStateLayer(hostEl);
const hostRole = computed(() => {
  if (itemRole) {
    return itemRole;
  }

  if (is === 'div') {
    return 'listitem';
  }

  return undefined;
});

useRipple(computed(() => (!disabled && is !== 'li' ? hostEl.value : undefined)));
</script>

<template>
  <component
    :is="is"
    ref="hostEl"
    class="md-list-item"
    :draggable="draggable"
    :disabled="is === 'button' && disabled ? true : undefined"
    :type="is === 'button' ? type : undefined"
    :aria-disabled="disabled && is !== 'button' ? 'true' : undefined"
    :role="hostRole"
    :class="{
      'md-state_hover': showVisualState && hover,
      'md-state_focused': showVisualState && focused,
      'md-state_pressed': showVisualState && durationPressedState,
      'md-state_disabled': disabled,
    }"
    @click="onClick"
    @keydown="onKeydown"
  >
    <MDStateLayer
      :hover="hover"
      :focused="focused"
      :pressed="durationPressedState"
      :disabled="disabled"
    />

    <span v-if="!!slots.leadingIcon" class="md-list-item__leading-icon">
      <slot name="leadingIcon" />
    </span>

    <span v-if="!!slots.leadingAvatarContainer" class="md-list-item__leading-avatar-container">
      <slot name="leadingAvatarContainer" />
    </span>

    <span class="md-list-item__body">
      <span class="md-list-item__headline">{{ headline }}</span>

      <span v-if="supportingText || !!slots.supportingText" class="md-list-item__supporting-text">
        <slot name="supportingText">{{ supportingText }}</slot>
      </span>
    </span>

    <span v-if="!!slots.trailingIcon" class="md-list-item__trailing-icon">
      <slot name="trailingIcon" />
    </span>
  </component>
</template>

<style scoped>
.md-list-item {
  --horizontal-gap: var(--md-list-item-horizontal-gap, 16px);
  --min-height: var(--md-list-item-min-height, 56px);
  --border-radius: var(--md-list-item-border-radius, 0px);

  --md-container-color: var(--md-list-item-container-color, var(--md-sys-color-surface));
  --md-content-color: var(--md-list-item-content-color, var(--md-sys-color-on-surface));

  position: relative;
  display: flex;
  align-items: center;
  min-height: var(--min-height);
  box-sizing: border-box;
  padding: 8px var(--horizontal-gap);
  border: 0;
  border-radius: var(--border-radius);
  background: var(--md-container-color);
  color: var(--md-content-color);
  font-family: var(--md-sys-typescale-body-large-font);
  text-align: start;
  transition-property: color, background-color, border-radius, box-shadow;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
  -webkit-tap-highlight-color: transparent;

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
    position: relative;
    z-index: 1;
    display: flex;
    min-width: 24px;
    min-height: 24px;

    color: var(--md-sys-color-on-surface-variant);
  }

  &__body {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow: auto;

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
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    overflow: hidden;
    flex-shrink: 0;
  }

  &__trailing-icon {
    position: relative;
    z-index: 1;
    margin-left: var(--horizontal-gap);

    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
