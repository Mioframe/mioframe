<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTextareaAutosize } from '@vueuse/core';
import { uniqueId } from '@shared/lib/uniqueId';

const { inputType = 'text', type = 'outlined' } = defineProps<{
  labelText: string;
  supportingText?: string;
  type?: 'filled' | 'outlined';
  disabled?: boolean;
  error?: boolean;
  maxCharacters?: number;
  inputType?:
    | 'color'
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'month'
    | 'number'
    | 'password'
    | 'search'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week'
    | 'multiline';
}>();

defineSlots<{
  leadingIcon(): unknown;
  trailingIcon(): unknown;
}>();

const modelValue = defineModel<string>();

/**
 * [ ] добавить outline тип
 */

const id = uniqueId('MDTextField');

const inputRef = ref<HTMLElement>();

useTextareaAutosize({
  element: computed(() =>
    inputRef.value instanceof HTMLTextAreaElement ? inputRef.value : undefined,
  ),
  input: computed(() => modelValue.value ?? ''),
  styleProp: 'minHeight',
});

const onClickField = () => {
  inputRef.value?.focus();
};

defineEmits<{
  focus: [];
  keydown: [payload: KeyboardEvent];
}>();
</script>

<template>
  <section
    class="md-text-field"
    :class="[
      {
        'md-text-field_empty': !modelValue?.length,
        'md-text-field_filled': modelValue?.length,
        'md-text-field_disabled': disabled,
        'md-text-field_error': error,
      },
      `md-text-field_${type}-type`,
    ]"
  >
    <div class="md-text-field__container" @click="onClickField">
      <span v-if="!!$slots.leadingIcon" class="md-text-field__leading-icon">
        <slot name="leadingIcon" />
      </span>

      <div class="md-text-field__body">
        <label class="md-text-field__label-text" :for="id">
          {{ labelText }}
        </label>

        <textarea
          v-if="inputType === 'multiline'"
          :id
          ref="inputRef"
          v-model="modelValue"
          class="md-text-field__input-text"
          :disabled
          :maxlength="maxCharacters"
          @focus="$emit('focus')"
          @keydown="$emit('keydown', $event)"
        />

        <input
          v-else
          :id
          ref="inputRef"
          v-model="modelValue"
          class="md-text-field__input-text"
          :disabled
          :maxlength="maxCharacters"
          :type="inputType"
          @focus="$emit('focus')"
          @keydown="$emit('keydown', $event)"
        />
      </div>

      <span v-if="!!$slots.trailingIcon" class="md-text-field__trailing-icon">
        <slot name="trailingIcon" />
      </span>
    </div>

    <div
      v-if="!!supportingText || !!maxCharacters"
      class="md-text-field__supporting-text"
    >
      <span>
        {{ supportingText }}
      </span>

      <span v-if="maxCharacters">
        {{ modelValue?.length ?? 0 }}/{{ maxCharacters }}
      </span>
    </div>
  </section>
</template>

<style scoped>
.md-text-field {
  position: relative;
  flex-grow: 1;
  --md-text-field-background: var(--md-container-color);
  background-color: var(--md-text-field-background);

  &.md-text-field_disabled {
    pointer-events: none;
  }

  &__container {
    --md-container-color: var(--md-sys-color-surface-container-highest);
    --md-content-color: var(--md-sys-color-on-surface);

    border-radius: var(--md-sys-shape-corner-extra-small-top);
    border-bottom: 1px solid var(--md-sys-color-on-surface-variant);

    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    min-height: 56px;
    padding: 8px 16px 7px;
    box-sizing: border-box;
    cursor: text;

    .md-text-field_outlined-type & {
      --md-container-color: inherit;

      border-radius: var(--md-sys-shape-corner-extra-small);
      border: 1px solid var(--md-sys-color-outline);
      padding: 7px 15px 7px;
    }

    .md-text-field_disabled & {
      background-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.04);
      border-bottom-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
      pointer-events: none;
    }

    .md-text-field_outlined-type.md-text-field_disabled & {
      border-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
      background-color: inherit;
    }

    .md-text-field:hover & {
      border-bottom: 1px solid var(--md-sys-color-on-surface);
      padding-bottom: 7px;
    }

    .md-text-field_outlined-type:hover & {
      border-color: var(--md-sys-color-on-surface);
    }

    .md-text-field:focus-within & {
      border-bottom: 2px solid var(--md-sys-color-primary);
      padding-bottom: 6px;
    }

    .md-text-field_outlined-type:focus-within & {
      border: 2px solid var(--md-sys-color-primary);
      padding: 6px 14px;
    }

    .md-text-field_error &,
    .md-text-field_error.md-text-field:focus-within & {
      border-color: var(--md-sys-color-error);
    }

    .md-text-field_error:hover & {
      border-color: var(--md-sys-color-on-error-container);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    cursor: text;

    .md-text-field__leading-icon ~ & {
      margin-left: 16px;

      .md-text-field__label-text {
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
    transition-duration: var(--md-sys-motion-duration-short4);
    transition-timing-function: var(--md-sys-motion-easing-standard-index);
    cursor: text;

    .md-text-field_outlined-type & {
      display: inline-block;
      padding: 0 4px;

      position: absolute;
      top: 15px;
      left: 15px;
    }

    .md-text-field__leading-icon ~ & {
      margin-left: 16px;
    }

    .md-text-field:focus-within &,
    .md-text-field_filled & {
      line-height: var(--md-sys-typescale-body-small-line-height);
      font-size: var(--md-sys-typescale-body-small-size);
    }
    .md-text-field_outlined-type:focus-within &,
    .md-text-field_outlined-type.md-text-field_filled & {
      position: absolute;
      top: -8px;
      padding: 0 4px;
      left: 8px;
      background-color: var(--md-text-field-background);
    }

    .md-text-field_disabled & {
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-text-field:hover & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-text-field_outlined-type:hover & {
      color: var(--md-sys-color-on-surface);
    }

    .md-text-field:focus-within & {
      color: var(--md-sys-color-primary);
    }

    .md-text-field_error &,
    .md-text-field_error.md-text-field:focus-within & {
      color: var(--md-sys-color-error);
    }

    .md-text-field_error:hover & {
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

    .md-text-field_disabled & {
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-text-field:hover & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-text-field_outlined-type:hover & {
      color: var(--md-sys-color-on-surface);
    }

    .md-text-field:focus-within & {
      color: var(--md-sys-color-on-surface-variant);
    }
  }

  &__leading-icon {
    margin-left: -4px;
    grid-area: leading-icon;

    .md-text-field_error & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-text-field_error:hover & {
      color: var(--md-sys-color-on-surface-variant);
    }
  }

  &__trailing-icon {
    margin-left: 16px;
    margin-right: -4px;
    grid-area: trailing-icon;

    .md-text-field_error &,
    .md-text-field_error.md-text-field:focus-within & {
      color: var(--md-sys-color-error);
    }

    .md-text-field_error:hover & {
      color: var(--md-sys-color-on-error-container);
    }
  }

  &__input-text {
    all: initial;
    color: var(--md-sys-color-on-surface);
    font-family: var(--md-sys-typescale-body-large-font);
    line-height: var(--md-sys-typescale-body-large-line-height);
    height: 1lh;
    font-size: var(--md-sys-typescale-body-large-size);
    font-weight: var(--md-sys-typescale-body-large-weight);
    letter-spacing: var(--md-sys-typescale-body-large-tracking);
    caret-color: var(--md-sys-color-primary);
    grid-area: input-text;
    transition-property: height, min-height;
    transition-duration: var(--md-sys-motion-duration-short4);
    transition-timing-function: var(--md-sys-motion-easing-standard-index);
    cursor: text;
    white-space: pre;
    scrollbar-width: none;

    .md-text-field_empty:not(:focus-within) & {
      opacity: 0;
      height: 0 !important;
      min-height: 0 !important;
    }

    .md-text-field_disabled & {
      pointer-events: none;
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-text-field:hover & {
      color: var(--md-sys-color-on-surface);
    }

    .md-text-field:focus-within & {
      color: var(--md-sys-color-on-surface);
    }

    .md-text-field_error & {
      color: var(--md-sys-color-on-surface);
      caret-color: var(--md-sys-color-error);
    }

    .md-text-field_error:hover & {
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

    .md-text-field_disabled & {
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-text-field:hover & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-text-field:focus-within & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-text-field_error &,
    .md-text-field_error.md-text-field:focus-within & {
      color: var(--md-sys-color-error);
    }

    .md-text-field_error:hover & {
      color: var(--md-sys-color-error);
    }
  }
}
</style>
