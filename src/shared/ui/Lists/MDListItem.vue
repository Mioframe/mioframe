<script setup lang="ts" generic="Is extends 'button' | 'a' | 'div' | 'li' = 'div'">
import { computed, ref, useAttrs, useTemplateRef } from 'vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  headline: string;
  supportingText?: string | undefined;
  lines?: 1 | 2 | 3 | undefined;
  is?: Is | undefined;
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

const attrs = useAttrs();

const itemTag = computed<'button' | 'a' | 'div' | 'li'>(() => props.is ?? 'div');
const isButtonHost = computed(() => itemTag.value === 'button');
const isAnchorHost = computed(() => itemTag.value === 'a');
const isStaticHost = computed(() => itemTag.value === 'div' || itemTag.value === 'li');
const isNativeInteractive = computed(() => isButtonHost.value || isAnchorHost.value);
const buttonType = computed<'button' | 'submit' | 'reset' | undefined | false>(() => {
  if (!isButtonHost.value) {
    return undefined;
  }

  return props.type || 'button';
});
const resolvedLines = computed(() => props.lines ?? 1);
const minHeight = computed(() => {
  switch (resolvedLines.value) {
    case 3:
      return '88px';
    case 2:
      return '72px';
    default:
      return '56px';
  }
});
const supportingTextClass = computed(() => ({
  'md-list-item__supporting-text--one-line': resolvedLines.value === 1,
  'md-list-item__supporting-text--two-lines': resolvedLines.value === 2,
  'md-list-item__supporting-text--three-lines': resolvedLines.value === 3,
}));
const activationKeys = new Set([' ', 'Enter']);

const onClick = (e: MouseEvent) => {
  if (props.disabled) {
    if (isAnchorHost.value || isStaticHost.value) {
      e.preventDefault();
      e.stopPropagation();
    }

    return;
  }

  if (isNativeInteractive.value) {
    emit('click', e);
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (props.disabled) {
    if ((isAnchorHost.value || isStaticHost.value) && activationKeys.has(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }

    return;
  }

  if (isNativeInteractive.value) {
    emit('keydown', e);
  }
};

const hostEl = useTemplateRef<HTMLElement>('hostEl');
const dragged = ref(false);
const showVisualState = computed(() => !props.disabled);
const { hover, focused, durationPressedState } = useStateLayer(hostEl, { dragged });
const hostRole = computed(() => {
  if (props.itemRole) {
    return props.itemRole;
  }

  if (itemTag.value === 'div') {
    return 'listitem';
  }

  return undefined;
});

const hostTabIndex = computed(() => {
  const rawTabIndex = attrs.tabindex;
  if (props.disabled && (isAnchorHost.value || (isStaticHost.value && rawTabIndex !== undefined))) {
    return -1;
  }

  return rawTabIndex;
});

const hostDraggable = computed(() => (!props.disabled ? props.draggable : undefined));

const onDragStart = () => {
  if (props.disabled) {
    return;
  }

  dragged.value = true;
};

const onDragEnd = () => {
  dragged.value = false;
};

useRipple(computed(() => (!props.disabled && itemTag.value !== 'li' ? hostEl.value : undefined)));
</script>

<template>
  <component
    :is="itemTag"
    ref="hostEl"
    v-bind="attrs"
    class="md-list-item"
    :style="{ '--md-list-item-min-height': minHeight }"
    :draggable="hostDraggable"
    :disabled="isButtonHost && props.disabled ? true : undefined"
    :type="buttonType"
    :tabindex="hostTabIndex"
    :aria-disabled="props.disabled && !isButtonHost ? 'true' : undefined"
    :role="hostRole"
    :class="{
      'md-state_hover': showVisualState && hover,
      'md-state_focused': showVisualState && focused,
      'md-state_pressed': showVisualState && durationPressedState,
      'md-state_dragged': showVisualState && dragged,
      'md-state_disabled': props.disabled,
    }"
    @click="onClick"
    @keydown="onKeydown"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @drop="onDragEnd"
  >
    <MDStateLayer
      :hover="hover"
      :focused="focused"
      :pressed="durationPressedState"
      :dragged="dragged"
      :disabled="props.disabled"
    />

    <span v-if="!!slots.leadingIcon" class="md-list-item__leading-icon">
      <slot name="leadingIcon" />
    </span>

    <span v-if="!!slots.leadingAvatarContainer" class="md-list-item__leading-avatar-container">
      <slot name="leadingAvatarContainer" />
    </span>

    <span class="md-list-item__body">
      <span class="md-list-item__headline">{{ props.headline }}</span>

      <span
        v-if="props.supportingText || !!slots.supportingText"
        class="md-list-item__supporting-text"
        :class="supportingTextClass"
      >
        <slot name="supportingText">{{ props.supportingText }}</slot>
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
  --md-list-item-supporting-color: var(
    --md-list-item-supporting-color-override,
    var(--md-sys-color-on-surface-variant)
  );
  --md-list-item-disabled-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
  --md-list-item-disabled-supporting-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);

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

    color: var(--md-list-item-supporting-color);
  }

  &__body {
    position: relative;
    z-index: 1;
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
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;

    color: var(--md-list-item-supporting-color);
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

    color: var(--md-list-item-supporting-color);
  }

  &.md-state_disabled,
  &:disabled,
  &[aria-disabled='true'] {
    --md-content-color: var(--md-list-item-disabled-content-color);
    --md-list-item-supporting-color: var(--md-list-item-disabled-supporting-color);
  }
}

.md-list-item:is(button:not(:disabled), a:not([aria-disabled='true'])) {
  cursor: pointer;
}
</style>
