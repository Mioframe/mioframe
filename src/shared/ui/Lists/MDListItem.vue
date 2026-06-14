<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useSlots, useTemplateRef } from 'vue';
import { useEventListener } from '@vueuse/core';
import { MDStateLayer, usePressed, useRipple, useStateLayer } from '../State';
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
// Row-level state tracking is needed when a trailing action is present so hover and
// pressed cover the full row width, including the padding areas around the trailing action.
const isMultiActionInList = computed(
  () => hasTrailingAction.value && usesInternalActionSurface.value,
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
} = useListItemAnatomy(props, slots, listContext, 'md-list-item');

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
const {
  hover: primaryHover,
  focused,
  durationPressedState: primaryDurationPressed,
} = useStateLayer(interactiveSurfaceEl, { dragged });

// Multi-action: track hover at root level so the state layer covers the full row,
// including the padding area around the trailing action. Cannot use useLastHover(rootEl)
// here because the global "last hovered" list would be overwritten by child element
// pointerenter events, making rootEl lose hover state as soon as the pointer moves over
// any child (primaryActionEl, icon buttons, etc.).
const rowHoverState = ref(false);
useEventListener(
  computed(() => (isMultiActionInList.value ? rootEl.value : null)),
  'pointerenter',
  (e: PointerEvent) => {
    if (e.pointerType !== 'touch') {
      rowHoverState.value = true;
    }
  },
  { passive: true },
);
useEventListener(
  computed(() => (isMultiActionInList.value ? rootEl.value : null)),
  'pointerleave',
  () => {
    rowHoverState.value = false;
  },
  { passive: true },
);

// Multi-action: track pressed at root level so the pressed state covers the full row.
const { durationPressedState: rowDurationPressed } = usePressed(
  computed(() => (isMultiActionInList.value ? rootEl.value : null)),
);

// Final resolved state: for multi-action items use the root-level trackers; for all
// other modes use the interactive surface trackers.
const hover = computed(() =>
  isMultiActionInList.value ? rowHoverState.value : primaryHover.value,
);
const durationPressedState = computed(() =>
  isMultiActionInList.value ? rowDurationPressed.value : primaryDurationPressed.value,
);

const rootClass = computed(() => ({
  'md-list-item': true,
  'md-list-item_in-list': inList.value,
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
      <!--
        Multi-action: row-level state layer placed before action siblings so it renders
        behind them (position: absolute; z-index: 0 covers the full container). The primary
        action and trailing action appear on top via their own z-index.
      -->
      <MDStateLayer
        v-if="hasTrailingAction"
        :hover="hover"
        :focused="focused"
        :pressed="durationPressedState"
        :dragged="dragged"
        :disabled="disabled"
      />

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
        <!-- Single-action: state layer inside the action element bounds. -->
        <MDStateLayer
          v-if="!hasTrailingAction"
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
        Trailing action: sibling of the primary action. The click.self.stop handler fires
        the primary action for clicks that land on the container padding (not on the slot
        content), eliminating dead zones inside the visual row without creating nested
        interactive controls.
      -->
      <span
        v-if="hasTrailingAction"
        class="md-list-item__trailing-action"
        @click.self.stop="onAction"
      >
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
}
</style>
