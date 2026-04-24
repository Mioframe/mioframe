<script setup lang="ts">
import { computed, ref, toRefs, useTemplateRef } from 'vue';
import { sessionUniqueId } from '@shared/lib/uniqueId';
import type { EmptyObject } from 'type-fest';
import { useFirstFocus } from '@shared/lib/useFirstFocus';
import { unrefElement } from '@vueuse/core';

const props = withDefaults(
  defineProps<{
    labelText: string;
    supportingText?: string | undefined;
    type?: 'filled' | 'outlined' | undefined;
    disabled?: boolean | undefined;
    error?: boolean | undefined;
    maxCharacters?: number | undefined;
    filled?: boolean | undefined;
    numberCharacters?: number | undefined;
    focused?: boolean | undefined;
    id?: string | undefined;
  }>(),
  {
    focused: undefined,
    type: 'outlined',
    numberCharacters: 0,
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const slots = defineSlots<{
  default(p: { id: string }): unknown;
  leadingIcon(p: EmptyObject): unknown;
  trailingIcon(p: EmptyObject): unknown;
}>();

const { focused, id } = toRefs(props);

const staticId = sessionUniqueId('MDFieldContainer');

const localId = computed(() => id.value ?? staticId);

const containerRef = useTemplateRef<HTMLElement>('containerRef');

const { focused: containerFirstFocused } = useFirstFocus(containerRef, {
  initialValue: false,
});

const onClickField = (event: MouseEvent) => {
  containerFirstFocused.value = true;
  emit('click', event);
};

const filedContainer = useTemplateRef('filedContainer');

const fieldFocused = ref(false);

const onFocusIn = () => {
  fieldFocused.value = true;
};

const onFocusOut = () => {
  fieldFocused.value = unrefElement(filedContainer)?.matches(':focus-within') ?? false;
};
</script>

<template>
  <section
    ref="filedContainer"
    class="md-field-container"
    :class="[
      {
        'md-field-container_empty': !filled,
        'md-field-container_filled': filled,
        'md-field-container_disabled': disabled,
        'md-field-container_error': error,
        'md-field-container_focused': focused ?? fieldFocused,
      },
      `md-field-container_${type}-type`,
    ]"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <div class="md md-field-container__container" @click="onClickField">
      <span v-if="!!slots.leadingIcon" class="md-field-container__leading-icon">
        <slot name="leadingIcon" />
      </span>

      <div class="md-field-container__body">
        <label class="md-field-container__label-text md" :for="localId">
          {{ labelText }}
        </label>

        <div ref="containerRef" class="md-field-container__input-container md">
          <slot :id="localId" />
        </div>
      </div>

      <span v-if="!!slots.trailingIcon" class="md-field-container__trailing-icon">
        <slot name="trailingIcon" />
      </span>
    </div>

    <div v-if="!!supportingText || !!maxCharacters" class="md-field-container__supporting-text">
      <span>
        {{ supportingText }}
      </span>

      <span v-if="maxCharacters"> {{ numberCharacters }}/{{ maxCharacters }} </span>
    </div>
  </section>
</template>

<style scoped>
.md-field-container {
  position: relative;
  flex-grow: 1;

  --md-container-color: var(--md-sys-color-surface-container-highest);
  --md-content-color: var(--md-sys-color-on-surface);

  --border-width: 0 0 1px 0;
  --border-color: var(--md-sys-color-on-surface-variant);
  --border-radius: var(--md-sys-shape-corner-extra-small-top);
  --padding: 8px 16px;
  --label-top: unset;
  --label-left: unset;

  &.md-field-container_outlined-type {
    --md-container-color: inherit;
    --border-radius: var(--md-sys-shape-corner-extra-small);
    --border-width: 1px;
    --border-color: var(--md-sys-color-outline);
    --padding: 8px 16px 8px;
    --label-top: 16px;
    --label-left: 16px;

    &.md-field-container_filled {
      --label-top: -8px;
      --label-left: 8px;
    }

    &:focus-within,
    &.md-field-container_focused {
      --border-width: 2px;
      --border-color: var(--md-sys-color-primary);
      --padding: 8px 16px;
      --label-top: -8px;
      --label-left: 8px;
    }
  }

  &:hover {
    --border-color: var(--md-sys-color-on-surface);
  }

  &.md-field-container_disabled {
    --md-container-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.04);
    --border-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    pointer-events: none;
  }

  &.md-field-container_outlined-type.md-field-container_disabled {
    --border-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
  }

  &.md-field-container_error,
  &.md-field-container_error.md-field-container:focus-within,
  &.md-field-container_error.md-field-container.md-field-container_focused {
    --border-color: var(--md-sys-color-error);

    &:hover {
      --border-color: var(--md-sys-color-on-error-container);
    }
  }

  &__container {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    min-height: 56px;
    padding: var(--padding);
    box-sizing: border-box;

    &::before {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;

      border-radius: var(--border-radius);
      border-width: var(--border-width);
      border-style: solid;
      border-color: var(--border-color);
      transition-property: border-radius, border-width, border-color;
      transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    cursor: text;
    max-width: 100%;

    .md-field-container__leading-icon ~ & {
      margin-left: 16px;

      .md-field-container__label-text {
        left: 51px;
      }
    }
  }

  &__label-text {
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-large-font);
    line-height: var(--md-sys-typescale-body-large-line-height);
    height: 1lh;
    font-size: var(--md-sys-typescale-body-large-size);
    font-weight: var(--md-sys-typescale-body-large-weight);
    letter-spacing: var(--md-sys-typescale-body-large-tracking);
    grid-area: label-text;
    transition-property: height, line-height, font-size, top, left;

    cursor: text;
    top: var(--label-top);
    left: var(--label-left);

    .md-field-container_outlined-type & {
      display: inline-block;
      padding: 0 4px;
      position: absolute;
    }

    .md-field-container__leading-icon ~ & {
      margin-left: 16px;
    }

    .md-field-container:focus-within &,
    .md-field-container.md-field-container_focused &,
    .md-field-container_filled & {
      line-height: var(--md-sys-typescale-body-small-line-height);
      font-size: var(--md-sys-typescale-body-small-size);
    }

    .md-field-container_outlined-type:focus-within &,
    .md-field-container_outlined-type.md-field-container_focused &,
    .md-field-container_outlined-type.md-field-container_filled & {
      padding: 0 4px;
    }

    .md-field-container_disabled & {
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-field-container:hover & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-field-container_outlined-type:hover & {
      color: var(--md-sys-color-on-surface);
    }

    .md-field-container:focus-within &,
    .md-field-container.md-field-container_focused & {
      color: var(--md-sys-color-primary);
    }

    .md-field-container_error &,
    .md-field-container_error.md-field-container:focus-within &,
    .md-field-container_error.md-field-container.md-field-container_focused & {
      color: var(--md-sys-color-error);
    }

    .md-field-container_error:hover & {
      color: var(--md-sys-color-on-error-container);
    }
  }

  &__trailing-icon,
  &__leading-icon {
    color: var(--md-sys-color-on-surface-variant);

    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;

    .md-field-container_disabled & {
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-field-container:hover & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-field-container_outlined-type:hover & {
      color: var(--md-sys-color-on-surface);
    }

    .md-field-container:focus-within &,
    .md-field-container.md-field-container_focused & {
      color: var(--md-sys-color-on-surface-variant);
    }
  }

  &__leading-icon {
    margin-left: -4px;
    grid-area: leading-icon;

    .md-field-container_error & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-field-container_error:hover & {
      color: var(--md-sys-color-on-surface-variant);
    }
  }

  &__trailing-icon {
    margin-left: 16px;
    margin-right: -4px;
    grid-area: trailing-icon;

    .md-field-container_error &,
    .md-field-container_error.md-field-container:focus-within &,
    .md-field-container_error.md-field-container.md-field-container_focused & {
      color: var(--md-sys-color-error);
    }

    .md-field-container_error:hover & {
      color: var(--md-sys-color-on-error-container);
    }
  }

  &__input-container {
    all: initial;
    color: var(--md-sys-color-on-surface);
    font-family: var(--md-sys-typescale-body-large-font);
    line-height: var(--md-sys-typescale-body-large-line-height);
    min-height: 1lh;
    font-size: var(--md-sys-typescale-body-large-size);
    font-weight: var(--md-sys-typescale-body-large-weight);
    letter-spacing: var(--md-sys-typescale-body-large-tracking);
    caret-color: var(--md-sys-color-primary);
    transition-property: height, min-height, opacity, transform;
    transition-duration: var(--md-sys-motion-duration-short4);
    transition-timing-function: var(--md-sys-motion-easing-standard-index);
    scrollbar-width: none;
    opacity: 1;
    transform: scaleY(1);

    .md-field-container.md-field-container_empty:not(:focus-within):not(.md-field-container_focused)
      & {
      opacity: 0;
      height: 0 !important;
      min-height: 0 !important;
      transform: scaleY(0);
    }

    .md-field-container_disabled & {
      pointer-events: none;
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-field-container:hover & {
      color: var(--md-sys-color-on-surface);
    }

    .md-field-container:focus-within &,
    .md-field-container.md-field-container_focused & {
      color: var(--md-sys-color-on-surface);
    }

    .md-field-container_error & {
      color: var(--md-sys-color-on-surface);
      caret-color: var(--md-sys-color-error);
    }

    .md-field-container_error:hover & {
      color: var(--md-sys-color-on-surface);
    }
  }

  &__supporting-text {
    font-family: var(--md-sys-typescale-body-small-font);
    font-weight: var(--md-sys-typescale-body-small-weight);
    font-size: var(--md-sys-typescale-body-small-size);
    line-height: var(--md-sys-typescale-body-small-line-height);
    letter-spacing: var(--md-sys-typescale-body-small-tracking);
    color: var(--md-sys-color-on-surface-variant);

    display: flex;
    column-gap: 16px;
    justify-content: space-between;
    margin-top: 4px;
    padding: 0 16px;

    .md-field-container_disabled & {
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-field-container:hover & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-field-container:focus-within &,
    .md-field-container.md-field-container_focused & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-field-container_error &,
    .md-field-container_error.md-field-container:focus-within &,
    .md-field-container_error.md-field-container.md-field-container_focused & {
      color: var(--md-sys-color-error);
    }

    .md-field-container_error:hover & {
      color: var(--md-sys-color-error);
    }
  }

  &.md-field-container_disabled {
    pointer-events: none;
  }
}
</style>
