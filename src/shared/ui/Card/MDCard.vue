<script setup lang="ts">
import { computed, onMounted, useTemplateRef, warn } from 'vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';
import { warnButtonModeRichContent } from './cardDevWarnings';

const props = withDefaults(
  defineProps<{
    variant?: 'elevated' | 'filled' | 'outlined' | undefined;
    mode?: 'static' | 'button' | 'link' | undefined;
    href?: string | undefined;
    disabled?: boolean | undefined;
    dragged?: boolean | undefined;
    nativeType?: 'button' | 'submit' | 'reset' | undefined;
  }>(),
  {
    variant: 'filled',
    mode: 'static',
    nativeType: 'button',
  },
);

const emit = defineEmits<{
  action: [event: MouseEvent];
}>();

defineSlots<{
  default: () => unknown;
}>();

const isAction = computed(() => props.mode !== 'static');
const isButtonAction = computed(() => props.mode === 'button');
const isLinkAction = computed(() => props.mode === 'link');
const isDisabled = computed(() => isAction.value && !!props.disabled);
const isDisabledLinkAction = computed(() => isLinkAction.value && isDisabled.value);
const showVisualState = computed(() => isAction.value && !isDisabled.value);

const rootTag = computed(() => {
  if (isLinkAction.value) {
    return 'a';
  }

  if (isButtonAction.value) {
    return 'button';
  }

  return 'div';
});

const buttonType = computed(() => (isButtonAction.value ? props.nativeType : undefined));

const rootEl = useTemplateRef<HTMLElement>('rootEl');
const { hover, focused, durationPressedState, dragged } = useStateLayer(rootEl, {
  dragged: computed(() => props.dragged),
});

const rootClass = computed(() => ({
  [`md-card_variant_${props.variant}`]: true,
  [`md-card_mode_${props.mode}`]: true,
  'md-state_hover': showVisualState.value && hover.value,
  'md-state_focused': showVisualState.value && focused.value,
  'md-state_pressed': showVisualState.value && durationPressedState.value,
  'md-state_dragged': showVisualState.value && dragged.value,
  'md-state_disabled': isDisabled.value,
}));

const onAction = (event: MouseEvent) => {
  if (!isAction.value) {
    return;
  }

  if (isDisabled.value) {
    if (isLinkAction.value) {
      event.preventDefault();
      event.stopPropagation();
    }

    return;
  }

  emit('action', event);
};

useRipple(computed(() => (isAction.value && !isDisabled.value ? rootEl.value : undefined)));

if (import.meta.env.DEV) {
  onMounted(() => {
    if (isLinkAction.value && !props.href) {
      warn('MDCard: mode="link" requires an href.');
    }

    if (isButtonAction.value && rootEl.value) {
      warnButtonModeRichContent(rootEl.value);
    }
  });
}
</script>

<template>
  <component
    :is="rootTag"
    ref="rootEl"
    class="md-card"
    :class="rootClass"
    :href="isLinkAction && !isDisabled ? href : undefined"
    :type="isButtonAction ? buttonType : undefined"
    :disabled="isButtonAction && isDisabled ? true : undefined"
    :aria-disabled="isDisabledLinkAction ? 'true' : undefined"
    :tabindex="isDisabledLinkAction ? -1 : undefined"
    @click="onAction"
  >
    <MDStateLayer
      v-if="isAction"
      :hover="hover"
      :focused="focused"
      :pressed="durationPressedState"
      :dragged="dragged"
      :disabled="isDisabled"
    />

    <slot />
  </component>
</template>

<style scoped>
.md-card {
  --md-private-card-container-opacity: 1;
  --md-private-card-outline-width: 0dp;
  --md-private-card-outline-color: var(--md-sys-color-outline);
  --md-private-card-outline-opacity: 1;

  /*
   * MDCard is a Material surface owner: it establishes its own resolved
   * container/content color as the current surface context for nested
   * Material primitives (`--md-current-container-color`/`--md-current-content-color`),
   * instead of leaving descendants reading the pane/page surface. Card has no
   * documented content-color token, so it defaults to on-surface, matching
   * every variant's hover/focus/pressed/dragged state-layer color — which is
   * also why the generic ripple/state-layer fallback to `--md-content-color`
   * already resolves to the correct pressed state-layer color without a
   * card-specific override.
   */
  --md-container-color: var(--md-private-card-container-color);
  --md-content-color: var(--md-sys-color-on-surface);
  --md-current-container-color: var(--md-container-color);
  --md-current-content-color: var(--md-content-color);

  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  gap: 8dp;
  padding: 16dp;
  border-style: solid;
  border-width: var(--md-private-card-outline-width);
  border-color: rgb(
    from var(--md-private-card-outline-color) r g b / var(--md-private-card-outline-opacity)
  );
  border-radius: var(--md-private-card-container-shape);
  background-color: rgb(
    from var(--md-private-card-container-color) r g b / var(--md-private-card-container-opacity)
  );
  box-shadow: var(--md-private-card-container-elevation);
  color: var(--md-content-color);
  font: inherit;
  text-align: start;
  text-decoration: none;
  transition-property: box-shadow, background-color, border-color;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);

  &_mode_button,
  &_mode_link {
    cursor: pointer;
    outline: none;

    &.md-state_disabled,
    &:disabled,
    &[aria-disabled='true'] {
      cursor: default;
    }
  }

  &_variant_elevated {
    --md-comp-elevated-card-container-color: var(--md-sys-color-surface-container-low);
    --md-comp-elevated-card-container-shape: var(--md-sys-shape-corner-medium);
    --md-comp-elevated-card-container-elevation: var(--md-sys-elevation-level1);
    --md-comp-elevated-card-container-shadow-color: var(--md-sys-color-shadow);
    --md-comp-elevated-card-container-surface-tint-layer-color: var(--md-sys-color-surface-tint);
    --md-comp-elevated-card-disabled-container-color: var(--md-sys-color-surface);
    --md-comp-elevated-card-disabled-container-opacity: 0.38;
    --md-comp-elevated-card-disabled-container-elevation: var(--md-sys-elevation-level1);
    --md-comp-elevated-card-focus-indicator-color: var(--md-sys-color-secondary);
    --md-comp-elevated-card-focus-indicator-thickness: 3dp;
    --md-comp-elevated-card-focus-indicator-offset: 2dp;
    --md-comp-elevated-card-focus-state-layer-color: var(--md-sys-color-on-surface);
    --md-comp-elevated-card-focus-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity,
      0.1
    );
    --md-comp-elevated-card-focus-container-elevation: var(--md-sys-elevation-level1);
    --md-comp-elevated-card-hover-state-layer-color: var(--md-sys-color-on-surface);
    --md-comp-elevated-card-hover-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity,
      0.08
    );
    --md-comp-elevated-card-hover-container-elevation: var(--md-sys-elevation-level2);
    --md-comp-elevated-card-pressed-state-layer-color: var(--md-sys-color-on-surface);
    --md-comp-elevated-card-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity,
      0.1
    );
    --md-comp-elevated-card-pressed-container-elevation: var(--md-sys-elevation-level1);
    --md-comp-elevated-card-dragged-state-layer-color: var(--md-sys-color-on-surface);
    --md-comp-elevated-card-dragged-state-layer-opacity: var(
      --md-sys-state-dragged-state-layer-opacity,
      0.16
    );
    --md-comp-elevated-card-dragged-container-elevation: var(--md-sys-elevation-level4);

    --md-private-card-container-color: var(--md-comp-elevated-card-container-color);
    --md-private-card-container-shape: var(--md-comp-elevated-card-container-shape);
    --md-private-card-container-elevation: var(--md-comp-elevated-card-container-elevation);
    --md-private-elevation-shadow-color: var(--md-comp-elevated-card-container-shadow-color);

    --md-private-state-layer-color: var(--md-comp-elevated-card-hover-state-layer-color);
    --md-state-hover-layer-opacity: var(--md-comp-elevated-card-hover-state-layer-opacity);
    --md-state-focus-layer-opacity: var(--md-comp-elevated-card-focus-state-layer-opacity);
    --md-state-pressed-layer-opacity: var(--md-comp-elevated-card-pressed-state-layer-opacity);
    --md-state-dragged-layer-opacity: var(--md-comp-elevated-card-dragged-state-layer-opacity);

    --md-focus-indicator-color: var(--md-comp-elevated-card-focus-indicator-color);
    --md-focus-indicator-thickness: var(--md-comp-elevated-card-focus-indicator-thickness);
    --md-focus-indicator-offset: var(--md-comp-elevated-card-focus-indicator-offset);

    &.md-state_hover {
      --md-private-card-container-elevation: var(--md-comp-elevated-card-hover-container-elevation);
    }

    &.md-state_focused {
      --md-private-card-container-elevation: var(--md-comp-elevated-card-focus-container-elevation);
    }

    &.md-state_pressed {
      --md-private-card-container-elevation: var(
        --md-comp-elevated-card-pressed-container-elevation
      );
    }

    &.md-state_dragged {
      --md-private-card-container-elevation: var(
        --md-comp-elevated-card-dragged-container-elevation
      );
    }

    &.md-state_disabled {
      --md-private-card-container-color: var(--md-comp-elevated-card-disabled-container-color);
      --md-private-card-container-opacity: var(--md-comp-elevated-card-disabled-container-opacity);
      --md-private-card-container-elevation: var(
        --md-comp-elevated-card-disabled-container-elevation
      );
    }
  }

  &_variant_filled {
    --md-comp-filled-card-container-color: var(--md-sys-color-surface-container-highest);
    --md-comp-filled-card-container-shape: var(--md-sys-shape-corner-medium);
    --md-comp-filled-card-container-elevation: var(--md-sys-elevation-level0);
    --md-comp-filled-card-container-shadow-color: var(--md-sys-color-shadow);
    --md-comp-filled-card-container-surface-tint-layer-color: var(--md-sys-color-surface-tint);
    --md-comp-filled-card-disabled-container-color: var(--md-sys-color-surface-variant);
    --md-comp-filled-card-disabled-container-opacity: 0.38;
    --md-comp-filled-card-disabled-container-elevation: var(--md-sys-elevation-level0);
    --md-comp-filled-card-focus-indicator-color: var(--md-sys-color-secondary);
    --md-comp-filled-card-focus-indicator-thickness: 3dp;
    --md-comp-filled-card-focus-indicator-offset: 2dp;
    --md-comp-filled-card-focus-state-layer-color: var(--md-sys-color-on-surface);
    --md-comp-filled-card-focus-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity,
      0.1
    );
    --md-comp-filled-card-focus-container-elevation: var(--md-sys-elevation-level0);
    --md-comp-filled-card-hover-state-layer-color: var(--md-sys-color-on-surface);
    --md-comp-filled-card-hover-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity,
      0.08
    );
    --md-comp-filled-card-hover-container-elevation: var(--md-sys-elevation-level1);
    --md-comp-filled-card-pressed-state-layer-color: var(--md-sys-color-on-surface);
    --md-comp-filled-card-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity,
      0.1
    );
    --md-comp-filled-card-pressed-container-elevation: var(--md-sys-elevation-level0);
    --md-comp-filled-card-dragged-state-layer-color: var(--md-sys-color-on-surface);
    --md-comp-filled-card-dragged-state-layer-opacity: var(
      --md-sys-state-dragged-state-layer-opacity,
      0.16
    );
    --md-comp-filled-card-dragged-container-elevation: var(--md-sys-elevation-level3);

    --md-private-card-container-color: var(--md-comp-filled-card-container-color);
    --md-private-card-container-shape: var(--md-comp-filled-card-container-shape);
    --md-private-card-container-elevation: var(--md-comp-filled-card-container-elevation);
    --md-private-elevation-shadow-color: var(--md-comp-filled-card-container-shadow-color);

    --md-private-state-layer-color: var(--md-comp-filled-card-hover-state-layer-color);
    --md-state-hover-layer-opacity: var(--md-comp-filled-card-hover-state-layer-opacity);
    --md-state-focus-layer-opacity: var(--md-comp-filled-card-focus-state-layer-opacity);
    --md-state-pressed-layer-opacity: var(--md-comp-filled-card-pressed-state-layer-opacity);
    --md-state-dragged-layer-opacity: var(--md-comp-filled-card-dragged-state-layer-opacity);

    --md-focus-indicator-color: var(--md-comp-filled-card-focus-indicator-color);
    --md-focus-indicator-thickness: var(--md-comp-filled-card-focus-indicator-thickness);
    --md-focus-indicator-offset: var(--md-comp-filled-card-focus-indicator-offset);

    &.md-state_hover {
      --md-private-card-container-elevation: var(--md-comp-filled-card-hover-container-elevation);
    }

    &.md-state_focused {
      --md-private-card-container-elevation: var(--md-comp-filled-card-focus-container-elevation);
    }

    &.md-state_pressed {
      --md-private-card-container-elevation: var(--md-comp-filled-card-pressed-container-elevation);
    }

    &.md-state_dragged {
      --md-private-card-container-elevation: var(--md-comp-filled-card-dragged-container-elevation);
    }

    &.md-state_disabled {
      --md-private-card-container-color: var(--md-comp-filled-card-disabled-container-color);
      --md-private-card-container-opacity: var(--md-comp-filled-card-disabled-container-opacity);
      --md-private-card-container-elevation: var(
        --md-comp-filled-card-disabled-container-elevation
      );
    }
  }

  &_variant_outlined {
    --md-comp-outlined-card-container-color: var(--md-sys-color-surface);
    --md-comp-outlined-card-container-shape: var(--md-sys-shape-corner-medium);
    --md-comp-outlined-card-container-elevation: var(--md-sys-elevation-level0);
    --md-comp-outlined-card-container-shadow-color: var(--md-sys-color-shadow);
    --md-comp-outlined-card-container-surface-tint-layer-color: var(--md-sys-color-surface-tint);
    --md-comp-outlined-card-outline-color: var(--md-sys-color-outline-variant);
    --md-comp-outlined-card-outline-width: 1dp;
    --md-comp-outlined-card-disabled-outline-color: var(--md-sys-color-outline);
    --md-comp-outlined-card-disabled-outline-opacity: 0.12;
    --md-comp-outlined-card-disabled-container-elevation: var(--md-sys-elevation-level0);
    --md-comp-outlined-card-focus-indicator-color: var(--md-sys-color-secondary);
    --md-comp-outlined-card-focus-indicator-thickness: 3dp;
    --md-comp-outlined-card-focus-indicator-offset: 2dp;
    --md-comp-outlined-card-focus-state-layer-color: var(--md-sys-color-on-surface);
    --md-comp-outlined-card-focus-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity,
      0.1
    );
    --md-comp-outlined-card-focus-outline-color: var(--md-sys-color-on-surface);
    --md-comp-outlined-card-focus-container-elevation: var(--md-sys-elevation-level0);
    --md-comp-outlined-card-hover-state-layer-color: var(--md-sys-color-on-surface);
    --md-comp-outlined-card-hover-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity,
      0.08
    );
    --md-comp-outlined-card-hover-outline-color: var(--md-sys-color-outline-variant);
    --md-comp-outlined-card-hover-container-elevation: var(--md-sys-elevation-level1);
    --md-comp-outlined-card-pressed-state-layer-color: var(--md-sys-color-on-surface);
    --md-comp-outlined-card-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity,
      0.1
    );
    --md-comp-outlined-card-pressed-outline-color: var(--md-sys-color-outline-variant);
    --md-comp-outlined-card-pressed-container-elevation: var(--md-sys-elevation-level0);
    --md-comp-outlined-card-dragged-state-layer-color: var(--md-sys-color-on-surface);
    --md-comp-outlined-card-dragged-state-layer-opacity: var(
      --md-sys-state-dragged-state-layer-opacity,
      0.16
    );
    --md-comp-outlined-card-dragged-outline-color: var(--md-sys-color-outline-variant);
    --md-comp-outlined-card-dragged-container-elevation: var(--md-sys-elevation-level3);

    --md-private-card-container-color: var(--md-comp-outlined-card-container-color);
    --md-private-card-container-shape: var(--md-comp-outlined-card-container-shape);
    --md-private-card-container-elevation: var(--md-comp-outlined-card-container-elevation);
    --md-private-elevation-shadow-color: var(--md-comp-outlined-card-container-shadow-color);
    --md-private-card-outline-color: var(--md-comp-outlined-card-outline-color);
    --md-private-card-outline-width: var(--md-comp-outlined-card-outline-width);

    --md-private-state-layer-color: var(--md-comp-outlined-card-hover-state-layer-color);
    --md-state-hover-layer-opacity: var(--md-comp-outlined-card-hover-state-layer-opacity);
    --md-state-focus-layer-opacity: var(--md-comp-outlined-card-focus-state-layer-opacity);
    --md-state-pressed-layer-opacity: var(--md-comp-outlined-card-pressed-state-layer-opacity);
    --md-state-dragged-layer-opacity: var(--md-comp-outlined-card-dragged-state-layer-opacity);

    --md-focus-indicator-color: var(--md-comp-outlined-card-focus-indicator-color);
    --md-focus-indicator-thickness: var(--md-comp-outlined-card-focus-indicator-thickness);
    --md-focus-indicator-offset: var(--md-comp-outlined-card-focus-indicator-offset);

    &.md-state_hover {
      --md-private-card-container-elevation: var(--md-comp-outlined-card-hover-container-elevation);
      --md-private-card-outline-color: var(--md-comp-outlined-card-hover-outline-color);
    }

    &.md-state_focused {
      --md-private-card-container-elevation: var(--md-comp-outlined-card-focus-container-elevation);
      --md-private-card-outline-color: var(--md-comp-outlined-card-focus-outline-color);
    }

    &.md-state_pressed {
      --md-private-card-container-elevation: var(
        --md-comp-outlined-card-pressed-container-elevation
      );
      --md-private-card-outline-color: var(--md-comp-outlined-card-pressed-outline-color);
    }

    &.md-state_dragged {
      --md-private-card-container-elevation: var(
        --md-comp-outlined-card-dragged-container-elevation
      );
      --md-private-card-outline-color: var(--md-comp-outlined-card-dragged-outline-color);
    }

    &.md-state_disabled {
      --md-private-card-container-elevation: var(
        --md-comp-outlined-card-disabled-container-elevation
      );
      --md-private-card-outline-color: var(--md-comp-outlined-card-disabled-outline-color);
      --md-private-card-outline-opacity: var(--md-comp-outlined-card-disabled-outline-opacity);
    }
  }
}
</style>
