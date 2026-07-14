<script setup lang="ts">
// eslint-disable-next-line no-restricted-imports -- used only to read aria-label/aria-labelledby for the listbox accessible-name dev warning, not as a forwarding escape hatch
import { computed, useAttrs, useTemplateRef } from 'vue';
import {
  useWarnSelectionListMissingAccessibleName,
  useWarnSelectionListTagMismatch,
} from './listDevWarnings';
import {
  provideMDListContext,
  type MDListModelValue,
  type MDListSelectionMode,
  type MDListStyle,
} from './listContext';
import { useListActionKeyboard } from './useListActionKeyboard';
import { useListSelectionKeyboard } from './useListSelectionKeyboard';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    modelValue?: MDListModelValue;
    listStyle?: MDListStyle | undefined;
    selectionMode?: MDListSelectionMode | undefined;
    tag?: 'div' | 'ul' | undefined;
    // Opt-in FLIP move animation for keyed direct slot children (Vue TransitionGroup).
    // Requires stable unique keys on the slotted children; see README.md.
    animateMoves?: boolean | undefined;
  }>(),
  {
    listStyle: 'standard',
    selectionMode: 'none',
    tag: 'div',
    animateMoves: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: MDListModelValue];
}>();

defineSlots<{
  default: () => unknown;
}>();

const containerEl = useTemplateRef<HTMLElement>('containerEl');

const resolvedListStyle = computed<MDListStyle>(() => props.listStyle);

const resolvedTag = computed<'div' | 'ul'>(() =>
  props.selectionMode === 'none' ? props.tag : 'div',
);

useWarnSelectionListTagMismatch(
  computed(() => props.selectionMode),
  computed(() => props.tag),
);

const listContext = provideMDListContext(
  resolvedListStyle,
  resolvedTag,
  computed(() => props.selectionMode),
  computed(() => props.modelValue),
  (value) => {
    emit('update:modelValue', value);
  },
);

const containerRole = computed(() => {
  if (props.selectionMode !== 'none') {
    return 'listbox';
  }

  return resolvedTag.value === 'ul' ? null : 'list';
});

const selectionActive = computed(() => props.selectionMode !== 'none');

useListSelectionKeyboard(containerEl, selectionActive, listContext.selectionRegistry);

const attrs = useAttrs();
const hasAccessibleName = computed(
  () => typeof attrs['aria-label'] === 'string' || typeof attrs['aria-labelledby'] === 'string',
);

useWarnSelectionListMissingAccessibleName(
  computed(() => containerRole.value === 'listbox'),
  hasAccessibleName,
);

useListActionKeyboard(
  containerEl,
  computed(() => !selectionActive.value),
  listContext.actionRegistry,
);
</script>

<template>
  <component
    :is="resolvedTag"
    ref="containerEl"
    v-bind="$attrs"
    class="md-list"
    :class="[`md-list_style_${resolvedListStyle}`, `md-list_selection-mode_${selectionMode}`]"
    :role="containerRole"
    :aria-multiselectable="selectionMode === 'multiple' ? 'true' : undefined"
  >
    <TransitionGroup v-if="animateMoves" move-class="md-list__item_move">
      <slot />
    </TransitionGroup>
    <slot v-else />
  </component>
</template>

<style scoped>
.md-list {
  --md-private-list-move-duration: 350ms;
  --md-private-list-move-easing: cubic-bezier(0.42, 1.67, 0.21, 0.9);

  --md-private-list-item-container-color: transparent;
  --md-private-list-item-action-shape: 4dp;
  --md-private-list-item-container-shape: 4dp;
  --md-private-list-item-leading-size: 20dp;
  --md-private-list-item-passive-trailing-min-size: 28dp;
  --md-private-list-item-trailing-action-padding-inline-start: 8dp;
  --md-private-list-item-trailing-action-min-target-size: 48dp;
  --md-private-list-item-trailing-action-reserved: calc(
    var(--md-private-list-item-trailing-action-padding-inline-start) +
      var(--md-private-list-item-trailing-action-min-target-size)
  );

  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  list-style: none;
  background: transparent;
  color: var(--md-current-content-color, inherit);

  &_style_segmented {
    /* Items own their corner shapes via action-surface border-radius. The list itself does
       not clip: a dragged item's elevation (box-shadow) must render outside the row bounds,
       so the explicit min-width: 0 is required to suppress the automatic grid/flex-item
       minimum size that would otherwise allow nowrap text to expand the container. */
    --md-comp-list-segmented-gap: 2dp;
    /* M3 Expressive segmented lists use filled items separated by gaps. The list
       container has no background; visual grouping comes from the item fill and the
       gaps that reveal the parent surface beneath. Item fill uses the documented
       segmented container color token. The private token cascades to item children,
       which derive --md-comp-list-list-item-container-color from it so that item-level
       overrides (selected, dragged) can still win via the public token. */
    --md-private-list-item-container-color: var(
      --md-comp-list-list-item-segmented-container-color,
      var(--md-sys-color-surface)
    );

    gap: var(--md-comp-list-segmented-gap);
    padding: 0;
    /* min-width: 0 is required when this element is a grid or flex item so that
       white-space: nowrap content inside cannot expand the containing track. */
    min-width: 0;
    border-radius: 16dp;
  }
}
</style>

<style>
/*
 * Move transition for animateMoves: TransitionGroup applies this class to slotted children
 * (the direct MDListItem/MDListSelectionItem elements) during Vue's FLIP reposition phase.
 * `:slotted()` does not reliably match here — slot content rendered through the nested
 * `<TransitionGroup>` does not carry MDList's slotted scope marker, so the scoped selector
 * never matches in the built output (verified against the compiled CSS and a real row's
 * computed style). This is a deliberate, narrow, non-scoped exception instead: strictly
 * BEM-namespaced to this one private class, matching the same pattern already used by
 * listItemAnatomy.css for List-family anatomy that must reach slotted content. Only `transform`
 * animates per the M3 Expressive fast-spatial Web conversion (verified via the material3 MCP,
 * styles/motion/overview/specs) — reorder is spatial movement of a small component.
 */
.md-list__item_move {
  transition: transform var(--md-private-list-move-duration) var(--md-private-list-move-easing);
}

@media (prefers-reduced-motion: reduce) {
  .md-list__item_move {
    transition: none;
  }
}
</style>
