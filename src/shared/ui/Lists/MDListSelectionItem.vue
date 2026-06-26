<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef, warn } from 'vue';
import MDSymbol from '../Icon/MDSymbol.vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';
import { useMDListContext, type MDListSelectionValue } from './listContext';
import { useListItemAnatomy } from './useListItemAnatomy';

type MDListLeadingType = 'icon' | 'avatar' | 'media' | 'control';

const props = withDefaults(
  defineProps<{
    disabled?: boolean | undefined;
    labelText: string;
    // eslint-disable-next-line vue/no-unused-properties -- consumed by useListItemAnatomy via props object; rule cannot trace indirect composable usage
    leadingType?: MDListLeadingType | undefined;
    // eslint-disable-next-line vue/no-unused-properties -- consumed by useListItemAnatomy via props object; rule cannot trace indirect composable usage
    lineCount?: 1 | 2 | 3 | undefined;
    overline?: string | undefined;
    supportingText?: string | undefined;
    value: MDListSelectionValue;
  }>(),
  {
    disabled: false,
    leadingType: 'icon',
  },
);

const slots = defineSlots<{
  leading: () => unknown;
  overline: () => unknown;
  supportingText: () => unknown;
  trailing: () => unknown;
}>();

const listContext = useMDListContext();

const listStyle = computed(() => listContext?.listStyle.value ?? 'standard');

const {
  hasLeading,
  hasOverline,
  hasSupportingText,
  hasTrailing,
  resolvedLineCount,
  hostStyle,
  leadingClass,
  supportingTextClass,
} = useListItemAnatomy(props, slots, 'md-list-selection-item');

const rootTag = computed(() => listContext?.itemTag.value ?? 'div');
// Only active when inside a list that has an explicit selection mode.
// Outside that context, rendering role=option without a listbox parent is invalid ARIA.
const isInSelectionList = computed(
  () => !!listContext && listContext.selectionMode.value !== 'none',
);
const isSelected = computed(() =>
  isInSelectionList.value ? (listContext?.isItemSelected(props.value) ?? false) : false,
);
const isDisabled = computed(() => props.disabled);

const rootEl = useTemplateRef<HTMLElement>('rootEl');
let unregisterSelectionItem: (() => void) | null = null;

// Only track interaction state when inside an active selection list. Outside that
// context the item has no action surface and must not look or feel interactive.
const interactiveEl = computed(() =>
  isInSelectionList.value && !isDisabled.value ? rootEl.value : null,
);
const { hover, focused, durationPressedState } = useStateLayer(interactiveEl, {});

const rootClass = computed(() => ({
  'md-list-selection-item': true,
  'md-list-selection-item_in-list': isInSelectionList.value,
  'md-list-selection-item_list-style_segmented':
    isInSelectionList.value && listStyle.value === 'segmented',
  'md-list-selection-item_line-count_1': resolvedLineCount.value === 1,
  'md-list-selection-item_line-count_2': resolvedLineCount.value === 2,
  'md-list-selection-item_line-count_3': resolvedLineCount.value === 3,
  'md-list-selection-item_selected': isSelected.value,
  'md-state_hover': hover.value,
  'md-state_focused': focused.value,
  'md-state_pressed': durationPressedState.value,
  'md-state_disabled': isDisabled.value,
}));

const onSelect = () => {
  if (!isDisabled.value && isInSelectionList.value) {
    listContext?.selectItem(props.value);
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    onSelect();
  }
};

// Ripple and state layer are active only inside a real selection list. An orphan
// MDListSelectionItem (no selection context) must not show interactive affordance
// since clicks do nothing.
useRipple(
  computed(() => (isInSelectionList.value && !isDisabled.value ? rootEl.value : undefined)),
);

onMounted(() => {
  unregisterSelectionItem =
    listContext?.selectionRegistry.registerItem({
      getElement: () => rootEl.value ?? null,
      isDisabled: () => isDisabled.value,
      isSelected: () => isSelected.value,
    }) ?? null;
});

onBeforeUnmount(() => {
  unregisterSelectionItem?.();
  unregisterSelectionItem = null;
});

if (import.meta.env.DEV) {
  onMounted(() => {
    if (!listContext) {
      warn('MDListSelectionItem: must be rendered inside an MDList with selectionMode set.');
    } else if (listContext.selectionMode.value === 'none') {
      warn(
        'MDListSelectionItem: parent MDList has selectionMode="none". Set selectionMode to "single" or "multiple".',
      );
    }
  });
}
</script>

<template>
  <component
    :is="rootTag"
    ref="rootEl"
    :class="rootClass"
    :style="hostStyle"
    :role="isInSelectionList ? 'option' : 'presentation'"
    :aria-selected="isInSelectionList ? String(isSelected) : undefined"
    :aria-disabled="isDisabled ? 'true' : undefined"
    @click="onSelect"
    @keydown="onKeydown"
  >
    <!-- State layer is only rendered when inside an active selection list so that orphan
         items have no visible interactive affordance. -->
    <MDStateLayer
      v-if="isInSelectionList"
      :hover="hover"
      :focused="focused"
      :pressed="durationPressedState"
      :disabled="isDisabled"
    />

    <div class="md-list-selection-item__body">
      <span class="md-list-selection-item__selection-indicator" aria-hidden="true">
        <MDSymbol v-if="isSelected" name="check" />
      </span>

      <span v-if="hasLeading" class="md-list-selection-item__leading" :class="leadingClass">
        <slot name="leading" />
      </span>

      <span class="md-list-selection-item__content">
        <span v-if="hasOverline" class="md-list-selection-item__overline">
          <slot name="overline">{{ overline }}</slot>
        </span>

        <span class="md-list-selection-item__label-text">{{ labelText }}</span>

        <span
          v-if="hasSupportingText"
          class="md-list-selection-item__supporting-text"
          :class="supportingTextClass"
        >
          <slot name="supportingText">{{ supportingText }}</slot>
        </span>
      </span>

      <span v-if="hasTrailing" class="md-list-selection-item__trailing">
        <slot name="trailing" />
      </span>
    </div>
  </component>
</template>

<style scoped>
.md-list-selection-item {
  /* Pointer cursor only when inside an active selection list and not disabled. */
  &_in-list:not(.md-state_disabled, [aria-disabled='true']) {
    cursor: pointer;
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

  &_list-style_segmented:first-child &__body {
    border-start-start-radius: 16dp;
    border-start-end-radius: 16dp;
  }

  &_list-style_segmented:last-child &__body {
    border-end-start-radius: 16dp;
    border-end-end-radius: 16dp;
  }
}
</style>
