<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { MDIconButton } from '../Button';
import MDSymbol from '../Icon/MDSymbol.vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';

const props = defineProps<{
  elevated?: boolean | undefined;
  label: string;
  type: 'assist' | 'filter' | 'input' | 'suggestion';
  selected?: boolean | undefined;
  draggable?: boolean | undefined;
  autofocus?: boolean | undefined;
  disabled?: boolean | undefined;
  closeTooltip?: string | undefined;
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
  clickClose: [event: MouseEvent];
}>();

const slots = defineSlots<{
  leadingIcon?: () => unknown;
  trailingIcon?: () => unknown;
}>();

const chipType = computed(() => props.type);
const isInputChip = computed(() => chipType.value === 'input');
const isAssistChip = computed(() => chipType.value === 'assist');
const isFilterChip = computed(() => chipType.value === 'filter');
const selected = computed(() => Boolean(props.selected));
const closeTooltip = computed(() => props.closeTooltip ?? 'remove');
const actionEl = useTemplateRef<HTMLButtonElement>('actionEl');
const dragged = ref(false);
const { hover, focused, durationPressedState } = useStateLayer(actionEl, { dragged });
const showVisualState = computed(() => !props.disabled);

useRipple(computed(() => (props.disabled ? undefined : actionEl.value)));

watch(
  [actionEl, () => props.autofocus, () => props.disabled],
  ([element, autofocus, disabled]) => {
    // The chip host owns autofocus because DatabaseViewChipsList focuses the
    // first rendered chip action when a database view selector opens.
    if (autofocus && element && !disabled) {
      element.focus();
    }
  },
  { immediate: true },
);

const onClickClose = (e: MouseEvent) => {
  e.stopPropagation();
  emit('clickClose', e);
};

const onChipClick = (event: MouseEvent) => {
  if (props.disabled) {
    return;
  }

  event.stopPropagation();
  emit('click', event);
};

const onDragStart = () => {
  if (props.disabled) {
    return;
  }

  dragged.value = true;
};

const onDragEnd = () => {
  dragged.value = false;
};
</script>

<template>
  <span
    v-if="isInputChip"
    class="md-chip md-chip_input-shell"
    :class="[
      `md-chip_${chipType}`,
      {
        'md-chip_elevated': props.elevated,
        'md-chip_selected': selected,
        'md-chip_disabled': props.disabled,
        'md-state_hover': showVisualState && hover,
        'md-state_focused': showVisualState && focused,
        'md-state_pressed': showVisualState && durationPressedState,
        'md-state_dragged': showVisualState && dragged,
      },
    ]"
    :aria-disabled="props.disabled ? 'true' : undefined"
    :draggable="props.draggable && !props.disabled ? 'true' : undefined"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @drop="onDragEnd"
  >
    <button
      ref="actionEl"
      type="button"
      class="md-chip__action"
      :disabled="props.disabled"
      @click="onChipClick"
    >
      <MDStateLayer
        :hover="hover"
        :focused="focused"
        :pressed="durationPressedState"
        :dragged="dragged"
        :disabled="props.disabled"
        class="md-chip__state-layer"
      />

      <span
        v-if="(isFilterChip && selected) || (isAssistChip && !!slots.leadingIcon)"
        class="md-chip__leading-icon"
      >
        <MDSymbol v-if="isFilterChip && selected" name="check" />

        <slot v-else name="leadingIcon" />
      </span>

      <span class="md-chip__label-text">
        {{ props.label }}
      </span>
    </button>

    <MDIconButton
      :tooltip="closeTooltip"
      md-symbol-name="close"
      size="extra-small"
      :disabled="props.disabled"
      class="md-chip__close-btn"
      @click="onClickClose"
    />
  </span>

  <button
    v-else
    ref="actionEl"
    class="md-chip"
    :class="[
      `md-chip_${chipType}`,
      {
        'md-chip_elevated': props.elevated,
        'md-chip_selected': selected,
        'md-chip_disabled': props.disabled,
        'md-state_hover': showVisualState && hover,
        'md-state_focused': showVisualState && focused,
        'md-state_pressed': showVisualState && durationPressedState,
        'md-state_dragged': showVisualState && dragged,
      },
    ]"
    type="button"
    :disabled="props.disabled"
    :draggable="props.draggable && !props.disabled ? 'true' : undefined"
    @click="onChipClick"
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
      class="md-chip__state-layer"
    />

    <span
      v-if="(isFilterChip && selected) || (isAssistChip && !!slots.leadingIcon)"
      class="md-chip__leading-icon"
    >
      <MDSymbol v-if="isFilterChip && selected" name="check" />

      <slot v-else name="leadingIcon" />
    </span>

    <span class="md-chip__label-text">
      {{ props.label }}
    </span>

    <span v-if="isFilterChip && !!slots.trailingIcon" class="md-chip__trailing-icon">
      <slot name="trailingIcon" />
    </span>
  </button>
</template>

<style lang="css" scoped>
.md-chip {
  --border-width: 1dp;
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 88dp;
  height: 32dp;
  padding: 0 16px;
  border-radius: var(--md-sys-shape-corner-small);
  border: var(--border-width) solid var(--md-sys-color-outline-variant);
  background: var(--md-container-color, transparent);
  color: var(--md-content-color, inherit);
  vertical-align: middle;
  cursor: pointer;
  flex-shrink: 0;
  --md-content-color: var(--md-sys-color-on-surface);
  -webkit-tap-highlight-color: transparent;
  transition-property: color, background-color, border-color, box-shadow, border-radius;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
  box-sizing: inherit;

  &__state-layer {
    inset: calc(-1 * var(--border-width));
  }

  &__action {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-width: 0;
    align-self: stretch;
    flex: 1 1 auto;
    padding: 0 8px 0 16px;
    border: 0;
    border-radius: inherit;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: inherit;
  }

  &__label-text {
    position: relative;
    z-index: 1;
    font-family: var(--md-sys-typescale-label-large-font);
    font-weight: var(--md-sys-typescale-label-large-weight);
    font-size: var(--md-sys-typescale-label-large-size);
    line-height: var(--md-sys-typescale-label-large-line-height);
    letter-spacing: var(--md-sys-typescale-label-large-tracking);
    white-space: nowrap;
    flex: 1 0;

    .md-chip__leading-icon + & {
      margin-left: 8px;
    }
  }

  &__leading-icon,
  &__trailing-icon {
    position: relative;
    z-index: 1;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 18dp;
    min-height: 18dp;
    max-height: 30px;
    flex: 0 1;

    :deep() {
      > * {
        width: 100%;
        height: 100%;
        --md-symbol-size: 18dp;
      }
    }
  }

  &__trailing-icon {
    margin-left: 8px;
  }

  &__close-btn {
    border-radius: inherit;
    flex-shrink: 0;
  }

  &_input-shell {
    padding-right: 0;
    padding-left: 0;
  }

  &_assist {
    --md-container-color: var(--md-sys-color-surface);

    &.md-chip_elevated {
      border-color: transparent;
      box-shadow: var(--md-sys-elevation-level1);
    }
  }

  &_filter {
    --md-container-color: var(--md-sys-color-surface);

    &.md-chip_selected {
      --md-container-color: var(--md-sys-color-secondary-container);
      --md-content-color: var(--md-sys-color-on-secondary-container);
      border-color: transparent;
    }
  }

  &_input {
    --md-container-color: var(--md-sys-color-surface);
  }

  &_suggestion {
    --md-container-color: var(--md-sys-color-surface-container-low);
    border-color: transparent;
  }

  &_disabled {
    cursor: default;
    opacity: 0.38;
  }
}
</style>
