<script setup lang="ts">
import { computed, onMounted, useSlots, useTemplateRef, warn } from 'vue';
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

defineSlots<{
  leading: () => unknown;
  overline: () => unknown;
  supportingText: () => unknown;
  trailing: () => unknown;
}>();

const slots = useSlots();
const listContext = useMDListContext();

const {
  hasLeading,
  hasOverline,
  hasSupportingText,
  hasTrailing,
  resolvedLineCount,
  hostStyle,
  leadingClass,
  supportingTextClass,
} = useListItemAnatomy(props, slots, listContext, 'md-list-selection-item');

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
const { hover, focused, durationPressedState } = useStateLayer(rootEl, {});

const rootClass = computed(() => ({
  'md-list-selection-item': true,
  'md-list-selection-item_in-list': true,
  'md-list-selection-item_line-count_1': resolvedLineCount.value === 1,
  'md-list-selection-item_line-count_2': resolvedLineCount.value === 2,
  'md-list-selection-item_line-count_3': resolvedLineCount.value === 3,
  'md-list-selection-item_selected': isSelected.value,
  'md-state_hover': !isDisabled.value && hover.value,
  'md-state_focused': !isDisabled.value && focused.value,
  'md-state_pressed': !isDisabled.value && durationPressedState.value,
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

useRipple(computed(() => (!isDisabled.value ? rootEl.value : undefined)));

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
    data-md-list-selection-item="true"
    :tabindex="-1"
    @click="onSelect"
    @keydown="onKeydown"
  >
    <MDStateLayer
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
  --md-comp-list-item-container-color: var(--md-sys-color-surface);
  --md-comp-list-item-disabled-label-text-color: rgb(
    from var(--md-sys-color-on-surface) r g b / 0.38
  );
  --md-comp-list-item-disabled-leading-icon-color: rgb(
    from var(--md-sys-color-on-surface) r g b / 0.38
  );
  --md-comp-list-item-disabled-supporting-text-color: rgb(
    from var(--md-sys-color-on-surface) r g b / 0.38
  );
  --md-comp-list-item-disabled-trailing-icon-color: rgb(
    from var(--md-sys-color-on-surface) r g b / 0.38
  );
  --md-comp-list-item-label-text-color: var(--md-sys-color-on-surface);
  --md-comp-list-item-leading-avatar-color: var(--md-sys-color-on-secondary-container);
  --md-comp-list-item-leading-icon-color: var(--md-sys-color-on-surface-variant);
  --md-comp-list-item-overline-color: var(--md-sys-color-on-surface-variant);
  --md-comp-list-item-selected-container-color: var(--md-sys-color-secondary-container);
  --md-comp-list-item-selected-label-text-color: var(--md-sys-color-on-secondary-container);
  --md-comp-list-item-selected-supporting-text-color: var(--md-sys-color-on-secondary-container);
  --md-comp-list-item-selected-trailing-icon-color: var(--md-sys-color-on-secondary-container);
  --md-comp-list-item-state-layer-color: var(--md-comp-list-item-label-text-color);
  --md-comp-list-item-supporting-text-color: var(--md-sys-color-on-surface-variant);
  --md-comp-list-item-trailing-icon-color: var(--md-sys-color-on-surface-variant);
  --md-comp-list-item-trailing-text-color: var(--md-sys-color-on-surface-variant);
  --md-content-color: var(--md-comp-list-item-state-layer-color);

  position: relative;
  display: flex;
  align-items: stretch;
  min-height: var(
    --md-comp-list-item-min-container-height,
    var(--md-private-list-item-resolved-container-height)
  );
  border: 0;
  border-radius: var(--md-private-list-item-container-shape, 0dp);
  background: var(--md-comp-list-item-container-color);
  color: var(--md-comp-list-item-label-text-color);
  list-style: none;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;

  &_selected {
    --md-comp-list-item-container-color: var(--md-comp-list-item-selected-container-color);
    --md-comp-list-item-label-text-color: var(--md-comp-list-item-selected-label-text-color);
    --md-comp-list-item-leading-icon-color: var(--md-comp-list-item-selected-label-text-color);
    --md-comp-list-item-overline-color: var(--md-comp-list-item-selected-supporting-text-color);
    --md-comp-list-item-state-layer-color: var(--md-comp-list-item-selected-label-text-color);
    --md-comp-list-item-supporting-text-color: var(
      --md-comp-list-item-selected-supporting-text-color
    );
    --md-comp-list-item-trailing-icon-color: var(--md-comp-list-item-selected-trailing-icon-color);
    --md-comp-list-item-trailing-text-color: var(
      --md-comp-list-item-selected-supporting-text-color
    );
  }

  &.md-state_disabled,
  &[aria-disabled='true'] {
    --md-comp-list-item-label-text-color: var(--md-comp-list-item-disabled-label-text-color);
    --md-comp-list-item-leading-icon-color: var(--md-comp-list-item-disabled-leading-icon-color);
    --md-comp-list-item-overline-color: var(--md-comp-list-item-disabled-supporting-text-color);
    --md-comp-list-item-state-layer-color: var(--md-comp-list-item-disabled-label-text-color);
    --md-comp-list-item-supporting-text-color: var(
      --md-comp-list-item-disabled-supporting-text-color
    );
    --md-comp-list-item-trailing-icon-color: var(--md-comp-list-item-disabled-trailing-icon-color);
    --md-comp-list-item-trailing-text-color: var(
      --md-comp-list-item-disabled-supporting-text-color
    );
    cursor: default;
  }

  &__body {
    position: relative;
    z-index: 0;
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
    min-height: var(
      --md-comp-list-item-min-container-height,
      var(--md-private-list-item-resolved-container-height)
    );
    padding-inline: var(--md-private-list-item-content-padding-inline-start)
      var(--md-private-list-item-content-padding-inline-end);
    padding-block: var(--md-private-list-item-content-padding-block);
    box-sizing: border-box;
  }

  &__selection-indicator,
  &__leading,
  &__trailing {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    min-width: 0;
  }

  &__selection-indicator {
    justify-content: center;
    width: 24dp;
    min-width: 24dp;
    color: var(--md-comp-list-item-leading-icon-color);
    margin-inline-end: var(--md-private-list-item-leading-space);
  }

  &__leading {
    justify-content: center;
    min-width: var(--md-private-list-item-leading-size);
    color: var(--md-comp-list-item-leading-icon-color);
    margin-inline-end: var(--md-private-list-item-leading-space);

    &_type_icon {
      min-width: var(--md-private-list-item-leading-size);
    }

    &_type_avatar {
      min-width: 40dp;
      min-height: 40dp;
    }

    &_type_media {
      min-width: 56dp;
      min-height: 56dp;
      align-self: center;
    }

    &_type_control {
      min-width: 48dp;
      min-height: 48dp;
    }
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }

  &__trailing {
    justify-content: flex-end;
    min-height: var(--md-private-list-item-passive-trailing-min-size);
    color: var(--md-comp-list-item-trailing-text-color);
    margin-inline-start: var(--md-private-list-item-trailing-space);
  }

  &__overline {
    color: var(--md-comp-list-item-overline-color);
    font-family: var(--md-sys-typescale-label-medium-font);
    font-size: var(--md-sys-typescale-label-medium-size);
    font-weight: var(--md-sys-typescale-label-medium-weight);
    line-height: var(--md-sys-typescale-label-medium-line-height);
    letter-spacing: var(--md-sys-typescale-label-medium-tracking);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__label-text {
    color: var(--md-comp-list-item-label-text-color);
    font-family: var(--md-sys-typescale-body-large-font);
    font-size: var(--md-sys-typescale-body-large-size);
    font-weight: var(--md-sys-typescale-body-large-weight);
    line-height: var(--md-sys-typescale-body-large-line-height);
    letter-spacing: var(--md-sys-typescale-body-large-tracking);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__supporting-text {
    color: var(--md-comp-list-item-supporting-text-color);
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    font-family: var(--md-sys-typescale-body-medium-font);
    font-size: var(--md-sys-typescale-body-medium-size);
    font-weight: var(--md-sys-typescale-body-medium-weight);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    letter-spacing: var(--md-sys-typescale-body-medium-tracking);

    &_two-line {
      -webkit-line-clamp: 1;
    }

    &_three-line {
      -webkit-line-clamp: 2;
    }
  }

  &_line-count_3 &__body {
    align-items: flex-start;
  }
}
</style>
