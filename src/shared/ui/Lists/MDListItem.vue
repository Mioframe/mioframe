<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  onMounted,
  ref,
  useAttrs,
  useSlots,
  useTemplateRef,
  warn,
} from 'vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';
import { useMDListContext } from './listContext';

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
    leadingType?: MDListLeadingType | undefined;
    lineCount?: 1 | 2 | 3 | undefined;
    mode?: MDListItemMode | undefined;
    nativeType?: 'button' | 'submit' | 'reset' | undefined;
    overline?: string | undefined;
    selected?: boolean | undefined;
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
const instance = getCurrentInstance();

const hasLeading = computed(() => !!slots.leading);
const hasOverline = computed(() => !!slots.overline || !!props.overline);
const hasSupportingText = computed(() => !!slots.supportingText || !!props.supportingText);
const hasTrailing = computed(() => !!slots.trailing);
const hasTrailingAction = computed(() => props.mode === 'multi-action' && !!slots.trailingAction);
const hasPrimaryAction = computed(() => props.mode !== 'static');
const inList = computed(() => listContext?.usesListSemantics.value ?? false);
const usesInternalActionSurface = computed(() => inList.value && hasPrimaryAction.value);

const resolvedLineCount = computed<1 | 2 | 3>(() => {
  if (props.lineCount) {
    return props.lineCount;
  }

  if (hasOverline.value && hasSupportingText.value) {
    return 3;
  }

  if (hasOverline.value || hasSupportingText.value) {
    return 2;
  }

  return 1;
});

const resolvedHeight = computed(
  () => listContext?.lineHeights.value[resolvedLineCount.value] ?? 56,
);
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

  return primaryActionEl.value;
});

const dragged = ref(false);
const { hover, focused, durationPressedState } = useStateLayer(interactiveSurfaceEl, { dragged });

const leadingClass = computed(() => `md-list-item__leading_type_${props.leadingType}`);
const hostStyle = computed(() => ({
  '--md-list-item-height': `${resolvedHeight.value}px`,
}));
const rootClass = computed(() => ({
  'md-list-item': true,
  'md-list-item_in-list': inList.value,
  'md-list-item_mode_static': props.mode === 'static',
  'md-list-item_mode_single-action': props.mode === 'single-action',
  'md-list-item_mode_multi-action': props.mode === 'multi-action',
  'md-list-item_line-count_1': resolvedLineCount.value === 1,
  'md-list-item_line-count_2': resolvedLineCount.value === 2,
  'md-list-item_line-count_3': resolvedLineCount.value === 3,
  'md-list-item_selected': props.selected,
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

const supportingTextClass = computed(() => ({
  'md-list-item__supporting-text_two-line': resolvedLineCount.value === 2,
  'md-list-item__supporting-text_three-line': resolvedLineCount.value === 3,
}));

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
    const vnodeProps = instance?.vnode.props ?? {};
    const hasActionListener = Object.keys(vnodeProps).some((key) => key.startsWith('onAction'));

    if (props.mode === 'single-action' && !props.href && !hasActionListener) {
      warn(
        'MDListItem: mode="single-action" requires either an @action listener or an href. Use mode="static" for non-interactive rows.',
      );
    }

    if (
      props.mode === 'multi-action' &&
      (!hasTrailingAction.value || (!hasActionListener && !props.href))
    ) {
      warn(
        'MDListItem: mode="multi-action" requires either a real primary @action or href, plus a #trailingAction slot.',
      );
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
    :href="!inList && mode === 'single-action' ? href : undefined"
    :type="!inList && mode === 'single-action' ? buttonType : undefined"
    :disabled="!inList && mode === 'single-action' && !href && disabled ? true : undefined"
    :aria-disabled="!inList && mode === 'single-action' && href && disabled ? 'true' : undefined"
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

      <span v-if="hasTrailingAction" class="md-list-item__trailing-action">
        <slot name="trailingAction" />
      </span>
    </template>

    <template v-else>
      <MDStateLayer
        v-if="mode === 'single-action'"
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

      <span v-if="hasTrailingAction" class="md-list-item__trailing-action">
        <slot name="trailingAction" />
      </span>
    </template>
  </component>
</template>

<style scoped>
.md-list-item {
  --md-comp-list-item-container-color: var(--md-sys-color-surface);
  --md-comp-list-item-content-color: var(--md-sys-color-on-surface);
  --md-comp-list-item-muted-color: var(--md-sys-color-on-surface-variant);
  --md-comp-list-item-selected-container-color: var(--md-sys-color-secondary-container);
  --md-comp-list-item-selected-content-color: var(--md-sys-color-on-secondary-container);
  --md-comp-list-item-disabled-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
  --md-content-color: var(--md-comp-list-item-content-color);

  position: relative;
  display: flex;
  align-items: stretch;
  min-height: var(--md-list-item-height);
  border: 0;
  border-radius: var(--md-list-item-wrapper-shape, 0dp);
  background: var(--md-comp-list-item-container-color);
  color: var(--md-comp-list-item-content-color);
  list-style: none;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;

  &_selected {
    --md-comp-list-item-container-color: var(--md-comp-list-item-selected-container-color);
    --md-comp-list-item-content-color: var(--md-comp-list-item-selected-content-color);
    --md-comp-list-item-muted-color: var(--md-comp-list-item-selected-content-color);
    --md-content-color: var(--md-comp-list-item-selected-content-color);
  }

  &.md-state_disabled,
  &:disabled,
  &[aria-disabled='true'] {
    --md-comp-list-item-content-color: var(--md-comp-list-item-disabled-color);
    --md-comp-list-item-muted-color: var(--md-comp-list-item-disabled-color);
    --md-content-color: var(--md-comp-list-item-disabled-color);
  }

  &.md-state_dragged {
    background: var(--md-sys-color-tertiary-container);
    box-shadow: var(--md-sys-elevation-level2);
    --md-comp-list-item-content-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-list-item-muted-color: var(--md-sys-color-on-tertiary-container);
    --md-content-color: var(--md-sys-color-on-tertiary-container);
  }

  &__primary-action,
  &__body,
  &:is(button, a) > &__body {
    position: relative;
    z-index: 0;
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
    min-height: var(--md-list-item-height);
    padding-inline: var(--md-list-item-padding-inline) var(--md-list-item-padding-inline-end);
    padding-block: var(--md-list-item-padding-block);
    gap: var(--md-list-item-gap);
    border: 0;
    border-radius: var(--md-list-item-action-shape, 0dp);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    text-decoration: none;
    box-sizing: border-box;
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
    min-width: 0;
    color: var(--md-comp-list-item-muted-color);
  }

  &__leading {
    justify-content: center;
    min-width: var(--md-list-item-leading-size);
    color: var(--md-comp-list-item-muted-color);

    &_type_icon {
      min-width: var(--md-list-item-leading-size);
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
    min-height: var(--md-list-item-passive-trailing-min-size);
  }

  &__trailing-action {
    justify-content: center;
    padding-inline: 8dp var(--md-list-item-padding-inline-end);
    min-width: 48dp;
    min-height: 48dp;
    align-self: center;
  }

  &__overline {
    color: var(--md-comp-list-item-muted-color);
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
    color: var(--md-comp-list-item-content-color);
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
    color: var(--md-comp-list-item-muted-color);
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

  &_line-count_3 &__primary-action,
  &_line-count_3 &__body {
    align-items: flex-start;
  }
}
</style>
