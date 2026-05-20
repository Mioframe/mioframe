<script setup lang="ts" generic="T extends 'assist' | 'filter' | 'input'">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { MDIconButton } from '../Button';
import MDSymbol from '../Icon/MDSymbol.vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';

const props = defineProps<{
  elevated?: boolean | undefined;
  label: string;
  type: T;
  selected?: (T extends 'filter' ? boolean : undefined) | undefined;
  draggable?: boolean | undefined;
  autofocus?: boolean | undefined;
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
  clickClose: [event: MouseEvent];
}>();

const slots = defineSlots<{
  leadingIcon: T extends 'assist' ? () => unknown : undefined;
  trailingIcon: T extends 'filter' ? () => unknown : undefined;
}>();

const chipType = computed(() => props.type);
const isInputChip = computed(() => chipType.value === 'input');
const selected = computed(() => Boolean(props.selected));
const actionEl = useTemplateRef<HTMLButtonElement>('actionEl');
const dragged = ref(false);
const { hover, focused, durationPressedState } = useStateLayer(actionEl, { dragged });
const showVisualState = computed(() => true);

useRipple(actionEl);

watch(
  [actionEl, () => props.autofocus],
  ([element, autofocus]) => {
    if (autofocus && element) {
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
  event.stopPropagation();
  emit('click', event);
};

const onDragStart = () => {
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
        'md-state_hover': showVisualState && hover,
        'md-state_focused': showVisualState && focused,
        'md-state_pressed': showVisualState && durationPressedState,
        'md-state_drag': dragged,
      },
    ]"
    :draggable="props.draggable ? 'true' : undefined"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @drop="onDragEnd"
  >
    <button ref="actionEl" type="button" class="md-chip__action" @click="onChipClick">
      <MDStateLayer
        :hover="hover"
        :focused="focused"
        :pressed="durationPressedState"
        :dragged="dragged"
      />

      <span
        v-if="!!slots.leadingIcon || (chipType === 'filter' && selected)"
        class="md-chip__leading-icon"
      >
        <MDSymbol v-if="chipType === 'filter' && selected" name="check" />

        <slot v-else name="leadingIcon" />
      </span>

      <span class="md-chip__label-text">
        {{ props.label }}
      </span>
    </button>

    <MDIconButton
      tooltip="remove"
      md-symbol-name="close"
      size="extra-small"
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
        'md-state_hover': showVisualState && hover,
        'md-state_focused': showVisualState && focused,
        'md-state_pressed': showVisualState && durationPressedState,
        'md-state_drag': dragged,
      },
    ]"
    type="button"
    :draggable="props.draggable ? 'true' : undefined"
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
    />

    <span
      v-if="!!slots.leadingIcon || (chipType === 'filter' && selected)"
      class="md-chip__leading-icon"
    >
      <MDSymbol v-if="chipType === 'filter' && selected" name="check" />

      <slot v-else name="leadingIcon" />
    </span>

    <span class="md-chip__label-text">
      {{ props.label }}
    </span>

    <span v-if="chipType === 'filter' && !!slots.trailingIcon" class="md-chip__trailing-icon">
      <slot name="trailingIcon" />
    </span>
  </button>
</template>

<style lang="css" scoped>
.md-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 88dp;
  height: 32dp;
  padding: 0 16px;
  border-radius: var(--md-sys-shape-corner-small);
  border: 1dp solid var(--md-sys-color-outline-variant);
  background: var(--md-container-color, transparent);
  color: var(--md-content-color, inherit);
  vertical-align: middle;
  cursor: pointer;
  flex-shrink: 0;
  --md-content-color: var(--md-sys-color-on-surface);
  -webkit-tap-highlight-color: transparent;
  transition-property: color, background-color, border-color, box-shadow, border-radius;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);

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

      .md-icon-button {
        --md-icon-button-icon-size: 18dp;
        --md-icon-button-padding: 0px;
      }
    }

    .md-chip_disabled &,
    .md-chip:disabled & {
      --md-content-color: rgb(var(--md-sys-color-on-surface) / r g b 0.38);
    }
  }

  &__close-btn {
    margin-right: 4px;
    margin-left: 0;
    flex-shrink: 0;
  }

  &__leading-icon {
    margin-left: -8px;
  }

  &__trailing-icon {
    margin-left: 8px;
    margin-right: -8px;
  }

  &_input-shell {
    padding: 0;
    gap: 4px;
  }

  &_elevated {
    z-index: 1;
    --md-state-box-shadow: var(--md-sys-elevation-level1);
    --md-container-color: var(--md-sys-color-surface-container-low);

    &.md-chip_disabled,
    &:disabled {
      --md-state-box-shadow: var(--md-sys-elevation-level0);
      --md-container-color: rgb(from var(--md-sys-color-on-surface) / r g b 0.12);
    }

    &:hover {
      --md-state-box-shadow: var(--md-sys-elevation-level2);
    }
  }

  &_filter {
    &.md-chip_selected {
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-container-color: var(--md-sys-color-secondary-container);
      border-color: var(--md-sys-color-secondary-container);
      border-width: 0;
    }

    &.md-chip_elevated {
      --md-container-color: var(--md-sys-color-surface-container-low);

      &.md-chip_selected {
        --md-container-color: var(--md-sys-color-secondary-container);
      }
    }
  }

  &_assist {
    .md-chip__leading-icon,
    .md-chip__trailing-icon {
      --md-content-color: var(--md-sys-color-primary);
    }
  }

  &.md-state_hover {
    --md-content-color: var(--md-sys-color-on-surface);
  }

  &_disabled,
  :disabled {
    --md-content-color: rgb(var(--md-sys-color-on-surface) / r g b 0.38);
    pointer-events: none;
    border-color: rgb(from var(--md-sys-color-on-surface) / r g b 0.12);
    --md-state-box-shadow: var(--md-sys-elevation-level0);
  }
}
</style>
