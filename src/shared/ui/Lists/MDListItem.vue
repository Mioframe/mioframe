<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useTemplateRef, warn } from 'vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';

type MDListItemMode =
  | 'static'
  | 'single-action'
  | 'multi-action'
  | 'single-select'
  | 'multi-select';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    labelText: string;
    supportingText?: string | undefined;
    overline?: string | undefined;
    lineCount?: 1 | 2 | 3 | undefined;
    mode?: MDListItemMode | undefined;
    containerTag?: 'div' | 'li' | undefined;
    href?: string | undefined;
    nativeType?: 'button' | 'submit' | 'reset' | undefined;
    selected?: boolean | undefined;
    disabled?: boolean | undefined;
    draggable?: boolean | undefined;
    selectionControlPosition?: 'leading' | 'trailing' | undefined;
  }>(),
  {
    mode: 'static',
    containerTag: 'div',
    nativeType: 'button',
    selectionControlPosition: 'trailing',
  },
);

const emit = defineEmits<{
  action: [e: MouseEvent];
}>();

const slots = defineSlots<{
  leading: () => unknown;
  overline: () => unknown;
  supportingText: () => unknown;
  trailing: () => unknown;
  trailingAction: () => unknown;
  selectionControl: () => unknown;
}>();

const attrs = useAttrs();

const isSelectionMode = computed(
  () => props.mode === 'single-select' || props.mode === 'multi-select',
);
const hasPrimaryAction = computed(() => props.mode !== 'static');
const hasSupportingText = computed(() => props.supportingText || !!slots.supportingText);
const hasOverline = computed(() => props.overline || !!slots.overline);
const hasLeading = computed(() => !!slots.leading);
const hasTrailing = computed(() => !!slots.trailing);
const hasTrailingAction = computed(() => props.mode === 'multi-action' && !!slots.trailingAction);

if (import.meta.env.DEV) {
  onMounted(() => {
    if (props.mode === 'multi-action' && !hasTrailingAction.value) {
      warn(
        'MDListItem: mode="multi-action" requires a #trailingAction slot. ' +
          'Without a secondary action surface this creates an invalid Material list item. ' +
          'Use mode="single-action" when there is only one action.',
      );
    }
  });
}
const hasSelectionControl = computed(() => isSelectionMode.value && !!slots.selectionControl);
const resolvedLineCount = computed(() => props.lineCount ?? (hasSupportingText.value ? 2 : 1));
const rootTag = computed(() =>
  props.mode === 'single-action' ? (props.href ? 'a' : 'button') : props.containerTag,
);
const primaryActionTag = computed<'button' | 'a'>(() => (props.href ? 'a' : 'button'));
const interactiveAttrs = computed(() => {
  if (props.mode === 'static') {
    return attrs;
  }

  const restAttrs = { ...attrs };
  delete restAttrs.class;
  delete restAttrs.style;
  return restAttrs;
});
const rootAttrs = computed(() => {
  if (!hasPrimaryAction.value || props.mode === 'single-action') {
    return attrs;
  }

  const { class: className, style, ...restAttrs } = attrs;
  const dataAttrs = Object.fromEntries(
    Object.entries(restAttrs).filter(([key]) => key.startsWith('data-')),
  );

  return {
    class: className,
    style,
    ...dataAttrs,
  };
});
const rootRole = computed(() => {
  if (props.mode === 'static' && props.containerTag === 'div' && attrs.role === undefined) {
    return 'listitem';
  }

  return undefined;
});
const rootDraggable = computed(() => (!props.disabled ? props.draggable : undefined));
const buttonType = computed(() => (props.href ? undefined : props.nativeType));
const interactiveAriaDisabled = computed(() => (props.disabled && props.href ? 'true' : undefined));
const interactiveTabIndex = computed(() => {
  if (!props.disabled || !props.href) {
    return interactiveAttrs.value.tabindex;
  }

  return -1;
});
const interactiveAriaSelected = computed(() => {
  if (!isSelectionMode.value || interactiveAttrs.value['aria-checked'] !== undefined) {
    return interactiveAttrs.value['aria-selected'];
  }

  return props.selected ? 'true' : 'false';
});
const supportingTextClass = computed(() => ({
  'md-list-item__supporting-text_one-line': resolvedLineCount.value === 1,
  'md-list-item__supporting-text_two-line': resolvedLineCount.value === 2,
  'md-list-item__supporting-text_three-line': resolvedLineCount.value === 3,
}));

const rootEl = useTemplateRef<HTMLElement>('rootEl');
const primaryActionEl = useTemplateRef<HTMLElement>('primaryActionEl');
const interactiveSurfaceEl = computed(() =>
  props.mode === 'single-action' ? rootEl.value : primaryActionEl.value,
);

const dragged = ref(false);
const showVisualState = computed(() => hasPrimaryAction.value && !props.disabled);
const { hover, focused, durationPressedState } = useStateLayer(interactiveSurfaceEl, { dragged });

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

const onSingleActionClick = (event: MouseEvent) => {
  if (props.mode !== 'single-action') {
    return;
  }

  onAction(event);
};

const onSingleActionKeydown = (event: KeyboardEvent) => {
  if (props.mode !== 'single-action') {
    return;
  }

  onActionKeydown(event);
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

useRipple(computed(() => (!props.disabled ? interactiveSurfaceEl.value : undefined)));
</script>

<template>
  <component
    :is="rootTag"
    ref="rootEl"
    v-bind="rootAttrs"
    class="md-list-item"
    :role="rootRole"
    :draggable="rootDraggable"
    :class="{
      'md-list-item_mode_static': mode === 'static',
      'md-list-item_mode_single-action': mode === 'single-action',
      'md-list-item_mode_multi-action': mode === 'multi-action',
      'md-list-item_mode_single-select': mode === 'single-select',
      'md-list-item_mode_multi-select': mode === 'multi-select',
      'md-list-item_line-count_1': resolvedLineCount === 1,
      'md-list-item_line-count_2': resolvedLineCount === 2,
      'md-list-item_line-count_3': resolvedLineCount === 3,
      'md-list-item_selected': selected,
      'md-state_hover': showVisualState && hover,
      'md-state_focused': showVisualState && focused,
      'md-state_pressed': showVisualState && durationPressedState,
      'md-state_dragged': showVisualState && dragged,
      'md-state_disabled': disabled,
    }"
    :href="mode === 'single-action' ? href : undefined"
    :disabled="mode === 'single-action' && !href && disabled ? true : undefined"
    :type="mode === 'single-action' ? buttonType : undefined"
    :tabindex="mode === 'single-action' ? interactiveTabIndex : undefined"
    :aria-disabled="mode === 'single-action' ? interactiveAriaDisabled : undefined"
    :aria-selected="mode === 'single-action' ? interactiveAriaSelected : undefined"
    @click="onSingleActionClick"
    @keydown="onSingleActionKeydown"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @drop="onDragEnd"
  >
    <MDStateLayer
      v-if="mode === 'single-action'"
      :hover="hover"
      :focused="focused"
      :pressed="durationPressedState"
      :dragged="dragged"
      :disabled="disabled"
    />

    <template v-if="mode === 'single-action' || mode === 'static'">
      <span
        v-if="hasLeading || (hasSelectionControl && selectionControlPosition === 'leading')"
        class="md-list-item__leading"
      >
        <slot
          v-if="hasSelectionControl && selectionControlPosition === 'leading'"
          name="selectionControl"
        />
        <slot v-if="hasLeading" name="leading" />
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

      <span
        v-if="hasTrailing || (hasSelectionControl && selectionControlPosition === 'trailing')"
        class="md-list-item__trailing"
      >
        <slot v-if="hasTrailing" name="trailing" />
        <slot
          v-if="hasSelectionControl && selectionControlPosition === 'trailing'"
          name="selectionControl"
        />
      </span>
    </template>

    <template v-else>
      <component
        :is="primaryActionTag"
        ref="primaryActionEl"
        v-bind="interactiveAttrs"
        class="md-list-item__primary-action"
        :href="href"
        :type="buttonType"
        :disabled="!href && disabled ? true : undefined"
        :tabindex="interactiveTabIndex"
        :aria-disabled="interactiveAriaDisabled"
        :aria-selected="interactiveAriaSelected"
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

        <span
          v-if="hasLeading || (hasSelectionControl && selectionControlPosition === 'leading')"
          class="md-list-item__leading"
        >
          <slot
            v-if="hasSelectionControl && selectionControlPosition === 'leading'"
            name="selectionControl"
          />
          <slot v-if="hasLeading" name="leading" />
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

        <span
          v-if="hasTrailing || (hasSelectionControl && selectionControlPosition === 'trailing')"
          class="md-list-item__trailing"
        >
          <slot v-if="hasTrailing" name="trailing" />
          <slot
            v-if="hasSelectionControl && selectionControlPosition === 'trailing'"
            name="selectionControl"
          />
        </span>
      </component>

      <span v-if="hasTrailingAction" class="md-list-item__trailing-action">
        <slot name="trailingAction" />
      </span>
    </template>
  </component>
</template>

<style scoped>
.md-list-item {
  --md-comp-list-item-container-color: var(--md-sys-color-surface);
  --md-comp-list-item-label-text-color: var(--md-sys-color-on-surface);
  --md-comp-list-item-supporting-text-color: var(--md-sys-color-on-surface-variant);
  --md-comp-list-item-overline-text-color: var(--md-sys-color-on-surface-variant);
  --md-comp-list-item-leading-color: var(--md-sys-color-on-surface-variant);
  --md-comp-list-item-trailing-color: var(--md-sys-color-on-surface-variant);
  --md-comp-list-item-selected-container-color: var(--md-sys-color-primary-container);
  --md-comp-list-item-selected-label-text-color: var(--md-sys-color-on-primary-container);
  --md-comp-list-item-selected-supporting-text-color: var(--md-sys-color-on-primary-container);
  --md-comp-list-item-selected-leading-color: var(--md-sys-color-on-primary-container);
  --md-comp-list-item-selected-trailing-color: var(--md-sys-color-on-primary-container);
  --md-comp-list-item-disabled-label-text-color: rgb(
    from var(--md-sys-color-on-surface) r g b / 0.38
  );
  --md-comp-list-item-disabled-supporting-text-color: rgb(
    from var(--md-sys-color-on-surface) r g b / 0.38
  );
  --md-comp-list-item-container-height: 56dp;
  --md-comp-list-container-shape: 0dp;
  --md-comp-list-item-container-shape: 0dp;
  --md-comp-list-item-leading-space: 16dp;
  --md-comp-list-item-trailing-space: 16dp;
  --md-comp-list-item-horizontal-padding: 16dp;
  --md-comp-list-item-trailing-end-padding: 24dp;
  --md-comp-list-item-leading-avatar-size: 40dp;
  --md-comp-list-item-leading-icon-size: 24dp;
  --md-comp-list-item-target-size: 48dp;

  position: relative;
  display: flex;
  align-items: stretch;
  min-height: var(--md-comp-list-item-container-height);
  box-sizing: border-box;
  border: 0;
  border-radius: var(--md-comp-list-item-container-shape);
  background: var(--md-comp-list-item-container-color);
  color: var(--md-comp-list-item-label-text-color);
  list-style: none;
  -webkit-tap-highlight-color: transparent;

  &:first-child {
    border-top-right-radius: max(
      var(--md-comp-list-item-container-shape),
      var(--md-comp-list-container-shape, 0dp)
    );
    border-top-left-radius: max(
      var(--md-comp-list-item-container-shape),
      var(--md-comp-list-container-shape, 0dp)
    );
  }

  &:last-child {
    border-bottom-right-radius: max(
      var(--md-comp-list-item-container-shape),
      var(--md-comp-list-container-shape, 0dp)
    );
    border-bottom-left-radius: max(
      var(--md-comp-list-item-container-shape),
      var(--md-comp-list-container-shape, 0dp)
    );
  }

  &_selected {
    --md-comp-list-item-container-color: var(--md-comp-list-item-selected-container-color);
    --md-comp-list-item-label-text-color: var(--md-comp-list-item-selected-label-text-color);
    --md-comp-list-item-supporting-text-color: var(
      --md-comp-list-item-selected-supporting-text-color
    );
    --md-comp-list-item-overline-text-color: var(
      --md-comp-list-item-selected-supporting-text-color
    );
    --md-comp-list-item-leading-color: var(--md-comp-list-item-selected-leading-color);
    --md-comp-list-item-trailing-color: var(--md-comp-list-item-selected-trailing-color);
  }

  &.md-state_disabled,
  &:disabled,
  &[aria-disabled='true'] {
    --md-comp-list-item-label-text-color: var(--md-comp-list-item-disabled-label-text-color);
    --md-comp-list-item-supporting-text-color: var(
      --md-comp-list-item-disabled-supporting-text-color
    );
    --md-comp-list-item-overline-text-color: var(
      --md-comp-list-item-disabled-supporting-text-color
    );
    --md-comp-list-item-leading-color: var(--md-comp-list-item-disabled-supporting-text-color);
    --md-comp-list-item-trailing-color: var(--md-comp-list-item-disabled-supporting-text-color);
  }

  &__primary-action,
  &:is(button, a) {
    position: relative;
    display: flex;
    align-items: stretch;
    flex: 1 1 auto;
    min-width: 0;
    min-height: var(--md-comp-list-item-target-size);
    box-sizing: border-box;
    padding-inline: var(--md-comp-list-item-horizontal-padding)
      var(--md-comp-list-item-trailing-end-padding);
    padding-block: 8dp;
    border: 0;
    border-radius: inherit;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    text-decoration: none;
    transition-property: color, background-color, border-radius, box-shadow;
    transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
  }

  &__primary-action:is(button:not(:disabled), a:not([aria-disabled='true'])),
  &:is(button:not(:disabled), a:not([aria-disabled='true'])) {
    cursor: pointer;
  }

  &__leading,
  &__trailing,
  &__trailing-action {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    color: var(--md-comp-list-item-trailing-color);
  }

  &__leading {
    min-width: var(--md-comp-list-item-leading-icon-size);
    color: var(--md-comp-list-item-leading-color);
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    color: inherit;
  }

  &__leading + &__content {
    margin-inline-start: var(--md-comp-list-item-leading-space);
  }

  &__trailing,
  &__trailing-action {
    margin-inline-start: var(--md-comp-list-item-trailing-space);
  }

  &__overline {
    color: var(--md-comp-list-item-overline-text-color);
    font-family: var(--md-sys-typescale-label-small-font);
    font-size: var(--md-sys-typescale-label-small-size);
    font-weight: var(--md-sys-typescale-label-small-weight);
    line-height: var(--md-sys-typescale-label-small-line-height);
    letter-spacing: var(--md-sys-typescale-label-small-tracking);
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

  &_mode_multi-action &__primary-action,
  &_mode_single-select &__primary-action,
  &_mode_multi-select &__primary-action {
    padding-inline-end: var(--md-comp-list-item-horizontal-padding);
  }

  &_mode_multi-action &__trailing-action {
    justify-content: center;
    padding-inline-end: var(--md-comp-list-item-trailing-end-padding);
    min-height: var(--md-comp-list-item-target-size);
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

    &_one-line {
      -webkit-line-clamp: 1;
    }

    &_two-line {
      -webkit-line-clamp: 1;
    }

    &_three-line {
      -webkit-line-clamp: 2;
    }
  }

  &_line-count_2 {
    --md-comp-list-item-container-height: 72dp;
  }

  &_line-count_3 {
    --md-comp-list-item-container-height: 88dp;
  }

  &_mode_static,
  &_mode_single-action {
    align-items: center;
    padding-inline: var(--md-comp-list-item-horizontal-padding)
      var(--md-comp-list-item-trailing-end-padding);
    padding-block: 8dp;
  }

  &_mode_static &__leading,
  &_mode_single-action &__leading {
    min-height: var(--md-comp-list-item-leading-icon-size);
  }

  &_mode_static &__trailing,
  &_mode_single-action &__trailing {
    min-height: var(--md-comp-list-item-target-size);
    justify-content: center;
  }

  &.md-list-item_line-count_3 {
    align-items: flex-start;
  }

  &.md-list-item_line-count_3 &__primary-action {
    align-items: flex-start;
  }

  &.md-list-item_line-count_3 &__primary-action,
  &.md-list-item_line-count_3.md-list-item_mode_static,
  &.md-list-item_line-count_3.md-list-item_mode_single-action {
    padding-block-start: 12dp;
  }
}
</style>
