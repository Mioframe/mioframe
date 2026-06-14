<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useSlots, useTemplateRef } from 'vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';
import {
  warnListItemInsideSelectionList,
  warnMultiActionMissingRequirements,
  warnSingleActionMissingHandler,
} from './listItemDevWarnings';
import { useMDListContext } from './listContext';
import { useListItemAnatomy } from './useListItemAnatomy';

type MDListItemMode = 'static' | 'single-action' | 'multi-action';
type MDListLeadingType = 'icon' | 'avatar' | 'media' | 'control';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    containerTag?: 'div' | 'li' | undefined;
    disabled?: boolean | undefined;
    draggable?: boolean | undefined;
    href?: string | undefined;
    labelText: string;
    // eslint-disable-next-line vue/no-unused-properties -- consumed by useListItemAnatomy via props object; rule cannot trace indirect composable usage
    leadingType?: MDListLeadingType | undefined;
    // eslint-disable-next-line vue/no-unused-properties -- consumed by useListItemAnatomy via props object; rule cannot trace indirect composable usage
    lineCount?: 1 | 2 | 3 | undefined;
    mode?: MDListItemMode | undefined;
    nativeType?: 'button' | 'submit' | 'reset' | undefined;
    overline?: string | undefined;
    supportingText?: string | undefined;
  }>(),
  {
    containerTag: 'div',
    leadingType: 'icon',
    mode: 'static',
    nativeType: 'button',
  },
);

const emit = defineEmits<{
  action: [event: MouseEvent];
}>();

defineSlots<{
  leading: () => unknown;
  overline: () => unknown;
  supportingText: () => unknown;
  trailing: () => unknown;
  trailingAction: () => unknown;
}>();

const slots = useSlots();
const attrs = useAttrs();
const listContext = useMDListContext();

const hasTrailingAction = computed(() => props.mode === 'multi-action' && !!slots.trailingAction);
const inList = computed(() => listContext?.usesListSemantics.value ?? false);
const selectionMode = computed(() => listContext?.selectionMode.value ?? 'none');
// Suppress trailing action when inside a selection list to prevent interactive controls
// from rendering inside a listbox (invalid ARIA and confusing interaction geometry).
const showTrailingActionInStaticPath = computed(
  () => hasTrailingAction.value && (!inList.value || selectionMode.value === 'none'),
);
const hasPrimaryAction = computed(() => props.mode !== 'static');
// Suppress interactive action surfaces inside selection lists to avoid rendering a
// button or link inside a listbox, which is invalid ARIA.
const usesInternalActionSurface = computed(
  () => inList.value && hasPrimaryAction.value && selectionMode.value === 'none',
);

const {
  hasLeading,
  hasOverline,
  hasSupportingText,
  hasTrailing,
  resolvedLineCount,
  hostStyle,
  leadingClass,
  supportingTextClass,
} = useListItemAnatomy(props, slots, 'md-list-item');

const rootTag = computed(() => {
  if (inList.value) {
    return listContext?.itemTag.value ?? 'div';
  }

  if (props.mode === 'single-action') {
    return props.href ? 'a' : 'button';
  }

  return props.containerTag;
});

const rootRole = computed(() => {
  if (inList.value) {
    if (selectionMode.value !== 'none') {
      return 'none';
    }

    return rootTag.value === 'li' ? undefined : 'listitem';
  }

  if (rootTag.value === 'li') {
    return undefined;
  }

  const explicitRole = typeof attrs.role === 'string' ? attrs.role : undefined;
  return explicitRole ?? (props.mode === 'static' ? 'listitem' : undefined);
});

const primaryActionTag = computed<'button' | 'a'>(() => (props.href ? 'a' : 'button'));
const showVisualState = computed(() => hasPrimaryAction.value && !props.disabled);
const buttonType = computed(() => (props.href ? undefined : props.nativeType));

const rootEl = useTemplateRef<HTMLElement>('rootEl');
const primaryActionEl = useTemplateRef<HTMLElement>('primaryActionEl');
const interactiveSurfaceEl = computed(() => {
  if (usesInternalActionSurface.value) {
    return primaryActionEl.value;
  }

  if (props.mode === 'single-action') {
    return rootEl.value;
  }

  return null;
});

const dragged = ref(false);
// Multi-action full-row hover: primary action is positioned absolute (inset: 0) so it
// covers the full visual row width. useLastHover(primaryActionEl) naturally handles
// trailing-action isolation: when the trailing slot content (icon button) becomes the
// last hovered element in the global hover list, the primary action is no longer last →
// hover = false. Empty trailing space has pointer-events: none on the container, so
// events fall through to the primary action → hover = true.
const { hover, focused, durationPressedState } = useStateLayer(interactiveSurfaceEl, { dragged });

const rootClass = computed(() => ({
  'md-list-item': true,
  'md-list-item_in-list': inList.value,
  'md-list-item_has-trailing-action': hasTrailingAction.value,
  'md-list-item_mode_static': props.mode === 'static',
  'md-list-item_mode_single-action': props.mode === 'single-action',
  'md-list-item_mode_multi-action': props.mode === 'multi-action',
  'md-list-item_line-count_1': resolvedLineCount.value === 1,
  'md-list-item_line-count_2': resolvedLineCount.value === 2,
  'md-list-item_line-count_3': resolvedLineCount.value === 3,
  'md-state_hover': showVisualState.value && hover.value,
  'md-state_focused': showVisualState.value && focused.value,
  'md-state_pressed': showVisualState.value && durationPressedState.value,
  'md-state_dragged': showVisualState.value && dragged.value,
  'md-state_disabled': props.disabled,
}));

const rootAttrs = computed(() => {
  if (!inList.value) {
    return attrs;
  }

  const forwardedEntries = Object.entries(attrs).filter(
    ([key]) => key === 'class' || key === 'style' || key === 'id' || key.startsWith('data-'),
  );

  return Object.fromEntries(forwardedEntries);
});

const interactiveAttrs = computed(() => {
  if (props.mode === 'static') {
    return attrs;
  }

  const entries = Object.entries(attrs).filter(
    ([key]) => key !== 'class' && key !== 'style' && (!inList.value || key !== 'id'),
  );
  return Object.fromEntries(entries);
});

const onAction = (event: MouseEvent) => {
  if (props.disabled) {
    if (props.href) {
      event.preventDefault();
      event.stopPropagation();
    }

    return;
  }

  emit('action', event);
};

const onActionKeydown = (event: KeyboardEvent) => {
  if (props.href && event.key === ' ') {
    event.preventDefault();

    if (!props.disabled) {
      event.currentTarget?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  }
};

const onRootClick = (event: MouseEvent) => {
  if (!inList.value && props.mode === 'single-action') {
    onAction(event);
  }
};

const onRootKeydown = (event: KeyboardEvent) => {
  if (!inList.value && props.mode === 'single-action') {
    onActionKeydown(event);
  }
};

const onDragStart = () => {
  if (!props.disabled) {
    dragged.value = true;
  }
};

const onDragEnd = () => {
  dragged.value = false;
};

if (import.meta.env.DEV) {
  onMounted(() => {
    const hasActionListener = Object.keys(attrs).some((key) => key.startsWith('onAction'));

    if (props.mode === 'single-action') {
      warnSingleActionMissingHandler(hasActionListener, !!props.href);
    }

    if (props.mode === 'multi-action') {
      warnMultiActionMissingRequirements(hasTrailingAction.value, hasActionListener, !!props.href);
    }

    if (selectionMode.value !== 'none') {
      warnListItemInsideSelectionList();
    }
  });
}

useRipple(computed(() => (!props.disabled ? interactiveSurfaceEl.value : undefined)));

defineExpose({
  focusPrimaryAction() {
    primaryActionEl.value?.focus();
    if (!primaryActionEl.value) {
      rootEl.value?.focus();
    }
  },
});
</script>

<template>
  <component
    :is="rootTag"
    ref="rootEl"
    v-bind="rootAttrs"
    :class="rootClass"
    :style="hostStyle"
    :role="rootRole"
    :aria-disabled="!inList && mode === 'single-action' && href && disabled ? 'true' : undefined"
    :href="!inList && mode === 'single-action' ? href : undefined"
    :type="!inList && mode === 'single-action' ? buttonType : undefined"
    :disabled="!inList && mode === 'single-action' && !href && disabled ? true : undefined"
    :tabindex="!inList && mode === 'single-action' && href && disabled ? -1 : undefined"
    :draggable="!disabled ? draggable : undefined"
    @click="onRootClick"
    @keydown="onRootKeydown"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @drop="onDragEnd"
  >
    <template v-if="usesInternalActionSurface">
      <component
        :is="primaryActionTag"
        ref="primaryActionEl"
        v-bind="interactiveAttrs"
        class="md-list-item__primary-action"
        :href="href"
        :type="buttonType"
        :disabled="!href && disabled ? true : undefined"
        :aria-disabled="href && disabled ? 'true' : undefined"
        :tabindex="href && disabled ? -1 : undefined"
        @click="onAction"
        @keydown="onActionKeydown"
      >
        <MDStateLayer
          :hover="hover"
          :focused="focused"
          :pressed="durationPressedState"
          :dragged="dragged"
          :disabled="disabled"
        />

        <span v-if="hasLeading" class="md-list-item__leading" :class="leadingClass">
          <slot name="leading" />
        </span>

        <span class="md-list-item__content">
          <span v-if="hasOverline" class="md-list-item__overline">
            <slot name="overline">{{ overline }}</slot>
          </span>

          <span class="md-list-item__label-text">{{ labelText }}</span>

          <span
            v-if="hasSupportingText"
            class="md-list-item__supporting-text"
            :class="supportingTextClass"
          >
            <slot name="supportingText">{{ supportingText }}</slot>
          </span>
        </span>

        <span v-if="hasTrailing" class="md-list-item__trailing">
          <slot name="trailing" />
        </span>
      </component>

      <!--
        Trailing action: pointer-events: none via CSS so empty padding falls through to
        the primary action (which is position: absolute; inset: 0 underneath). The slot
        content (icon button) restores its own pointer-events via the browser default.
      -->
      <span v-if="hasTrailingAction" class="md-list-item__trailing-action">
        <slot name="trailingAction" />
      </span>
    </template>

    <template v-else>
      <!--
        Standalone single-action only: the root element is the interactive surface so
        the state layer goes here. Not rendered inside selection lists where the item
        is structurally suppressed to static appearance (role=none).
      -->
      <MDStateLayer
        v-if="mode === 'single-action' && !inList"
        :hover="hover"
        :focused="focused"
        :pressed="durationPressedState"
        :dragged="dragged"
        :disabled="disabled"
      />

      <div class="md-list-item__body">
        <span v-if="hasLeading" class="md-list-item__leading" :class="leadingClass">
          <slot name="leading" />
        </span>

        <span class="md-list-item__content">
          <span v-if="hasOverline" class="md-list-item__overline">
            <slot name="overline">{{ overline }}</slot>
          </span>

          <span class="md-list-item__label-text">{{ labelText }}</span>

          <span
            v-if="hasSupportingText"
            class="md-list-item__supporting-text"
            :class="supportingTextClass"
          >
            <slot name="supportingText">{{ supportingText }}</slot>
          </span>
        </span>

        <span v-if="hasTrailing" class="md-list-item__trailing">
          <slot name="trailing" />
        </span>
      </div>

      <span v-if="showTrailingActionInStaticPath" class="md-list-item__trailing-action">
        <slot name="trailingAction" />
      </span>
    </template>
  </component>
</template>

<style>
/* Shared List-family anatomy: token defaults, state modifiers, body layout, element
   geometry, and typography. Imported as a non-scoped block so MDListItem and
   MDListSelectionItem share one implementation instead of duplicating it. */
@import './listItemAnatomy.css';
</style>

<style scoped>
.md-list-item {
  /* Dragged state is MDListItem-only (selection items do not support drag). */
  &.md-state_dragged {
    background: var(--md-sys-color-tertiary-container);
    box-shadow: var(--md-sys-elevation-level2);
    --md-comp-list-item-label-text-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-list-item-leading-icon-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-list-item-overline-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-list-item-state-layer-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-list-item-supporting-text-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-list-item-trailing-icon-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-list-item-trailing-text-color: var(--md-sys-color-on-tertiary-container);
  }

  /* Button/link resets specific to action surface elements. */
  &__primary-action,
  &:is(button, a) > &__body {
    border: 0;
    border-radius: var(--md-private-list-item-action-shape, 0dp);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    text-decoration: none;
  }

  /* Pointer cursor only for enabled interactive elements. */
  &__primary-action:is(button:not(:disabled), a:not([aria-disabled='true'])),
  &:is(button:not(:disabled), a:not([aria-disabled='true'])) {
    cursor: pointer;
  }

  /* Trailing action: flex container, padding, and sizing specific to MDListItem. */
  &__trailing-action {
    justify-content: center;
    color: var(--md-comp-list-item-trailing-icon-color);
    padding-inline: 8dp var(--md-private-list-item-content-padding-inline-end);
    min-width: 48dp;
    min-height: 48dp;
    align-self: center;
  }

  /*
   * Multi-action geometry: primary action covers the full row via position: absolute;
   * inset: 0. Trailing action sits on top as an absolute overlay with pointer-events:
   * none so empty padding falls through to the primary action hit-target underneath.
   * Slot content (icon button) restores its own pointer-events via browser default.
   * useLastHover(primaryActionEl) sees hover only when pointer is NOT inside the icon
   * button, giving correct per-region hover state without root-level tracking.
   */
  &_has-trailing-action &__primary-action {
    position: absolute;
    inset: 0;
    flex: none;
    padding-inline-end: calc(
      var(--md-private-list-item-content-padding-inline-end) +
        var(--md-private-list-item-trailing-action-reserved, 56dp)
    );
  }

  &_has-trailing-action &__trailing-action {
    position: absolute;
    inset-inline-end: 0;
    inset-block: 0;
    flex: none;
    /* Container background is transparent to pointer events: empty trailing padding
       falls through to the primary-action hit target underneath. */
    pointer-events: none;

    /* Restore interactivity for the direct slot content (icon button or similar)
       so it keeps its own hit area and click handler. */
    > * {
      pointer-events: auto;
    }
  }
}
</style>
