<script setup lang="ts">
// eslint-disable-next-line no-restricted-imports -- MDListItem is a documented transparent host/adaptor: it renders a polymorphic native element (`rootTag`) and forwards $attrs to that host as part of its public contract.
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useTemplateRef } from 'vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';
import {
  warnListItemInsideSelectionList,
  warnMultiActionMissingRequirements,
} from './listItemDevWarnings';
import { splitListItemAttrs } from './listItemAttrs';
import { useMDListContext } from './listContext';
import { isFocusableActionElement } from './listActionItemNavigation';
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
    // External controlled dragged state for sortable/reorder consumers. Combined with the
    // component's own dragstart/dragend/drop handling via `effectiveDragged` below.
    dragged?: boolean | undefined;
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

const slots = defineSlots<{
  leading: () => unknown;
  overline: () => unknown;
  supportingText: () => unknown;
  trailing: () => unknown;
  trailingAction: () => unknown;
}>();

const attrs = useAttrs();
const listContext = useMDListContext();

const hasTrailingAction = computed(() => props.mode === 'multi-action' && !!slots.trailingAction);
const isInList = computed(() => listContext?.usesListSemantics.value ?? false);
const selectionMode = computed(() => listContext?.selectionMode.value ?? 'none');
const listStyle = computed(() => listContext?.listStyle.value ?? 'standard');
// Selection lists nest options with role="option"; an item rendered in that context must
// drop its own list-item/action semantics so it does not assert a conflicting ARIA role.
const isSelectionListItem = computed(() => isInList.value && selectionMode.value !== 'none');
const isAction = computed(() => props.mode !== 'static');
const isLinkAction = computed(() => isAction.value && !!props.href);
const isButtonAction = computed(() => isAction.value && !props.href);
// Suppress trailing action when inside a selection list to prevent interactive controls
// from rendering inside a listbox (invalid ARIA and confusing interaction geometry).
const allowsTrailingAction = computed(
  () => hasTrailingAction.value && (!isInList.value || selectionMode.value === 'none'),
);
// Render the internal primary-action surface when:
// - inside a non-selection list (single-action or multi-action in list context), OR
// - standalone multi-action (needs a real primary-action button/a separate from the root
//   so the trailing action slot remains an independent hit target).
// Standalone single-action is excluded: root IS the interactive surface (button/a).
// Selection lists are excluded: nesting an interactive control inside listbox is invalid ARIA.
const usesPrimaryActionSurface = computed(
  () =>
    isAction.value && (isInList.value ? !isSelectionListItem.value : props.mode === 'multi-action'),
);
// Standalone single-action only: there is no separate primary-action element, so the root
// itself is the interactive surface (button/a) and carries the action attrs/handlers.
const usesRootActionSurface = computed(
  () => isAction.value && !isInList.value && !usesPrimaryActionSurface.value,
);
// A disabled link must stay focusable-but-inert per the component's link contract: it does
// not navigate, but unlike a disabled button it cannot use the native `disabled` attribute
// (links ignore it), so aria-disabled + tabindex=-1 carry the suppressed semantics instead.
const isDisabledLinkAction = computed(() => isLinkAction.value && props.disabled);

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
  if (isInList.value) {
    return listContext?.itemTag.value ?? 'div';
  }

  if (usesRootActionSurface.value) {
    return props.href ? 'a' : 'button';
  }

  return props.containerTag;
});

const rootRole = computed(() => {
  if (isInList.value) {
    if (isSelectionListItem.value) {
      return 'none';
    }

    return rootTag.value === 'li' ? undefined : 'listitem';
  }

  if (rootTag.value === 'li') {
    return undefined;
  }

  // Standalone items have no parent MDList to own list semantics, so a standalone
  // static row gets no implicit role="listitem" — that would assert membership in a
  // list structure that does not exist. Only an explicit consumer-provided role is
  // preserved.
  return typeof attrs.role === 'string' ? attrs.role : undefined;
});

const primaryActionTag = computed<'button' | 'a'>(() => (props.href ? 'a' : 'button'));
const showVisualState = computed(() => isAction.value && !props.disabled);
const buttonType = computed(() => (props.href ? undefined : props.nativeType));

const rootEl = useTemplateRef<HTMLElement>('rootEl');
const primaryActionEl = useTemplateRef<HTMLElement>('primaryActionEl');
const trailingActionEl = useTemplateRef<HTMLElement>('trailingActionEl');

/**
 * Resolves the focusable element inside the trailing action slot. Bounded to this row's
 * own trailing wrapper only — the slot content is consumer-owned (typically one icon
 * button), so this narrow lookup resolves which element keyboard traversal should focus
 * without MDListItem needing to know the consumer's markup shape.
 * @returns The focusable trailing action element, or `null` when absent.
 */
const getTrailingFocusableElement = (): HTMLElement | null =>
  // eslint-disable-next-line no-restricted-syntax -- justified DOM lookup, not component coordination: scoped to this row's own trailing wrapper to find a focus target inside consumer-owned slot content whose markup MDListItem does not control.
  trailingActionEl.value?.querySelector<HTMLElement>('button, a[href], [tabindex]') ?? null;
const interactiveSurfaceEl = computed(() => {
  if (usesPrimaryActionSurface.value) {
    return primaryActionEl.value;
  }

  if (usesRootActionSurface.value) {
    return rootEl.value;
  }

  return null;
});

const localDragged = ref(false);
// Multi-action full-row hover: primary action and trailing action are stacked in the
// same grid cell (see listItemAnatomy.css/_has-trailing-action), so the primary action
// still covers the full visual row width. useLastHover(primaryActionEl) naturally
// handles trailing-action isolation: when the trailing slot content (icon button)
// becomes the last hovered element in the global hover list, the primary action is no
// longer last → hover = false. Empty trailing space has pointer-events: none on the
// container, so events fall through to the primary action → hover = true.
const { hover, focused, durationPressedState } = useStateLayer(interactiveSurfaceEl, {
  dragged: localDragged,
});
// Single effective dragged state driving both the root implementation class and every
// nested MDStateLayer: external consumers (e.g. sortable) control `props.dragged`, while
// native drag events still set `localDragged` for unmanaged usage.
const effectiveDragged = computed(() => props.dragged || localDragged.value);

const rootClass = computed(() => ({
  'md-list-item': true,
  'md-list-item_in-list': isInList.value,
  'md-list-item_list-style_segmented': isInList.value && listStyle.value === 'segmented',
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
  'md-state_dragged': showVisualState.value && effectiveDragged.value,
  'md-state_disabled': props.disabled,
}));

const splitAttrs = computed(() => splitListItemAttrs(attrs, usesPrimaryActionSurface.value));
const rootAttrs = computed(() => splitAttrs.value.rootAttrs);
const interactiveAttrs = computed(() => splitAttrs.value.interactiveAttrs);

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

// Native button/link semantics already give correct keyboard activation (Enter for both,
// Space for buttons only) — no synthetic keydown→click bridging is needed or wanted.
const onRootClick = (event: MouseEvent) => {
  if (usesRootActionSurface.value) {
    onAction(event);
  }
};

const onDragStart = () => {
  if (!props.disabled) {
    localDragged.value = true;
  }
};

const onDragEnd = () => {
  localDragged.value = false;
};

if (import.meta.env.DEV) {
  onMounted(() => {
    if (props.mode === 'multi-action') {
      warnMultiActionMissingRequirements(hasTrailingAction.value);
    }

    if (selectionMode.value !== 'none') {
      warnListItemInsideSelectionList();
    }
  });
}

let unregisterActionItem: (() => void) | null = null;

// Register once per in-list item and let the registry getters read live reactive state
// (Approach 1). This stays correct when `mode`, the list's `selectionMode`, or
// action-surface availability changes after mount: a row with no current primary-action
// element (static row, suppressed selection-list row) reports `getPrimaryElement() ===
// null`, so `listActionItemNavigation` filters it out instead of the registration itself
// going stale. Re-registering on every topology change would add unregister/re-register
// ordering edge cases that this approach avoids entirely.
onMounted(() => {
  if (!isInList.value) {
    return;
  }

  unregisterActionItem =
    listContext?.actionRegistry.registerItem({
      getPrimaryElement: () => primaryActionEl.value ?? null,
      getTrailingElement: getTrailingFocusableElement,
      // Option A: `disabled` disables the whole row topology, so a disabled row reports
      // both columns disabled and keyboard traversal skips both targets.
      isPrimaryDisabled: () => Boolean(props.disabled),
      isTrailingDisabled: () =>
        Boolean(props.disabled) || !isFocusableActionElement(getTrailingFocusableElement()),
    }) ?? null;
});

onBeforeUnmount(() => {
  unregisterActionItem?.();
  unregisterActionItem = null;
});

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
    :aria-disabled="usesRootActionSurface && isDisabledLinkAction ? 'true' : undefined"
    :href="usesRootActionSurface ? href : undefined"
    :type="usesRootActionSurface ? buttonType : undefined"
    :disabled="usesRootActionSurface && isButtonAction && disabled ? true : undefined"
    :tabindex="usesRootActionSurface && isDisabledLinkAction ? -1 : undefined"
    :draggable="!disabled ? draggable : undefined"
    @click="onRootClick"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @drop="onDragEnd"
  >
    <template v-if="usesPrimaryActionSurface">
      <component
        :is="primaryActionTag"
        ref="primaryActionEl"
        v-bind="interactiveAttrs"
        class="md-list-item__primary-action"
        :href="href"
        :type="buttonType"
        :disabled="isButtonAction && disabled ? true : undefined"
        :aria-disabled="isDisabledLinkAction ? 'true' : undefined"
        :tabindex="isDisabledLinkAction ? -1 : undefined"
        @click="onAction"
      >
        <MDStateLayer
          :hover="hover"
          :focused="focused"
          :pressed="durationPressedState"
          :dragged="effectiveDragged"
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
        the primary action (grid-stacked underneath, see listItemAnatomy.css). The slot
        content (icon button) restores its own pointer-events via the browser default.
      -->
      <span
        v-if="allowsTrailingAction"
        ref="trailingActionEl"
        class="md-list-item__trailing-action"
        :inert="disabled || undefined"
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
        v-if="usesRootActionSurface"
        :hover="hover"
        :focused="focused"
        :pressed="durationPressedState"
        :dragged="effectiveDragged"
        :disabled="disabled"
      />

      <span class="md-list-item__body">
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
      </span>
    </template>
  </component>
</template>

<style scoped>
.md-list-item {
  /* Dragged state is MDListItem-only (selection items do not support drag). Elevation
     matches the documented md.comp.list.list-item.dragged.container.elevation token
     (M3 Elevation 4); the content/state-layer color remaps are wired in
     listItemAnatomy.css. */
  &.md-state_dragged {
    box-shadow: var(--md-private-list-item-dragged-elevation);
  }

  /* Button/link resets specific to action surface elements. */
  &__primary-action,
  &:is(button, a) > &__body {
    border: 0;
    border-radius: var(--md-private-list-item-action-shape, 4dp);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    text-decoration: none;
    outline: none;
  }

  /* Pointer cursor only for enabled interactive elements. */
  &__primary-action:is(button:not(:disabled), a:not([aria-disabled='true'])),
  &:is(button:not(:disabled), a:not([aria-disabled='true'])) {
    cursor: pointer;
  }

  /*
   * Trailing action: flex container, padding, and sizing specific to MDListItem.
   * Anatomy: [between-space gap to content][min-target-size button][trailing-space gap
   * to row edge] — the inline padding places the 48dp hit target 12dp from the content
   * and 16dp from the row's outer edge, matching the primary-action reserve below.
   * The project's global box-sizing: border-box reset (modern-normalize) means a plain
   * `min-width: 48dp` only floors the *padded* box, not the content area inside the
   * padding — so min-width must include the padding it sits alongside (between-space +
   * target size + trailing-space) to actually guarantee a 48dp content slot flush with
   * both paddings, keeping the visible button (and the invisible enlarged hit target
   * centered on it) aligned with the documented edge/gap geometry instead of drifting by
   * however much narrower the button's own visual size is than the 48dp target.
   */
  &__trailing-action {
    justify-content: center;
    color: var(--md-comp-list-list-item-trailing-icon-color);
    padding-inline: var(--md-comp-list-list-item-between-space)
      var(--md-comp-list-list-item-trailing-space);
    min-width: calc(
      var(--md-comp-list-list-item-between-space) +
        var(--md-private-list-item-trailing-action-min-target-size, 48dp) +
        var(--md-comp-list-list-item-trailing-space)
    );
    min-height: var(--md-private-list-item-trailing-action-min-target-size, 48dp);
    align-self: center;
  }

  /*
   * Multi-action geometry: primary action and trailing action are stacked in the same
   * grid cell (instead of position: absolute) so the primary action still covers the
   * full row and the trailing action still overlays it with pointer-events: none so
   * empty padding falls through to the primary-action hit-target underneath. Grid
   * stacking (unlike absolute positioning) keeps both children in normal flow for
   * sizing purposes, so the row's auto height grows to fit primary-action content taller
   * than the resolved Material min-height token (e.g. a wrapped three-line row) instead
   * of capping the row at that token and clipping the overflow against the boundary.
   * Slot content (icon button) restores its own pointer-events via browser default.
   * useLastHover(primaryActionEl) sees hover only when pointer is NOT inside the icon
   * button, giving correct per-region hover state without root-level tracking.
   */
  &_has-trailing-action {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  /* Reserve must mirror the trailing-action container's own anatomy exactly:
     between-space (content gap) + the target's own min size + trailing-space (row-edge
     padding), so the right edge lands at trailing-space, not between-space. */
  &_has-trailing-action &__primary-action {
    grid-area: 1 / 1;
    padding-inline-end: calc(
      var(--md-comp-list-list-item-between-space) +
        var(--md-private-list-item-trailing-action-min-target-size, 48dp) +
        var(--md-comp-list-list-item-trailing-space)
    );
  }

  &_has-trailing-action &__trailing-action {
    grid-area: 1 / 1;
    justify-self: end;
    align-self: stretch;
    /* Container background is transparent to pointer events: empty trailing padding
       falls through to the primary-action hit target underneath. */
    pointer-events: none;

    /* Restore interactivity for the direct slot content (icon button or similar)
       so it keeps its own hit area and click handler. */
    > * {
      pointer-events: auto;
    }
  }

  /* Segmented-list shape: each item owns its own corner rounding based on its position
     among siblings inside the segmented MDList. The parent list only signals the
     segmented variant (via listContext.listStyle → the _list-style_segmented class);
     it does not reach into this component's internals to apply the shape itself. */
  &_list-style_segmented:first-child {
    border-start-start-radius: 16dp;
    border-start-end-radius: 16dp;
  }

  &_list-style_segmented:last-child {
    border-end-start-radius: 16dp;
    border-end-end-radius: 16dp;
  }

  &_list-style_segmented:first-child:last-child {
    border-radius: 16dp;
  }

  /* Action-surface rounding: MDStateLayer and the ripple element both use
     border-radius: inherit, so shaping the action surface directly gives state
     layers and ripples the correct shape without container overflow clipping. */
  &_list-style_segmented:first-child &__primary-action,
  &_list-style_segmented:first-child &__body {
    border-start-start-radius: 16dp;
    border-start-end-radius: 16dp;
  }

  &_list-style_segmented:last-child &__primary-action,
  &_list-style_segmented:last-child &__body {
    border-end-start-radius: 16dp;
    border-end-end-radius: 16dp;
  }
}
</style>
