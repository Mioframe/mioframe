<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { useTextareaAutosize } from '@vueuse/core';
import { toString } from 'es-toolkit/compat';
import MDFieldContainer from './MDFieldContainer.vue';

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
  readonly?: boolean;
}>();

const slots = defineSlots<{
  leadingIcon(): unknown;
  trailingIcon(): unknown;
}>();

const modelValue = defineModel<string | number | undefined>();

const inputRef = useTemplateRef('inputRef');

const modelValueString = computed(() => toString(modelValue.value));

useTextareaAutosize({
  element: computed(() =>
    inputRef.value instanceof HTMLTextAreaElement ? inputRef.value : undefined,
  ),
  input: computed(() => modelValueString.value),
  styleProp: 'minHeight',
});

defineEmits<{
  focus: [e: FocusEvent];
  keydown: [payload: KeyboardEvent];
}>();
</script>

<template>
  <MDFieldContainer
    :label-text="labelText"
    :disabled="disabled"
    :error="error"
    :max-characters="maxCharacters"
    :supporting-text="supportingText"
    :type="type"
    :filled="!!modelValue"
    :number-characters="modelValueString.length"
    class="md-text-field"
  >
    <template v-if="!!slots.leadingIcon" #leadingIcon>
      <slot name="leadingIcon" />
    </template>

    <template #default="{ id }">
      <textarea
        v-if="inputType === 'multiline'"
        :id="id"
        ref="inputRef"
        v-model="modelValue"
        class="md-text-field__input-text"
        :disabled="disabled"
        :maxlength="maxCharacters"
        :readonly="readonly"
        @focus="$emit('focus', $event)"
        @keydown="$emit('keydown', $event)"
      />

      <input
        v-else
        :id="id"
        ref="inputRef"
        v-model="modelValue"
        class="md-text-field__input-text"
        :disabled="disabled"
        :maxlength="maxCharacters"
        :type="inputType"
        :readonly="readonly"
        @focus="$emit('focus', $event)"
        @keydown="$emit('keydown', $event)"
      />
    </template>

    <template v-if="!!slots.trailingIcon" #trailingIcon>
      <slot name="trailingIcon" />
    </template>
  </MDFieldContainer>
</template>

<style scoped>
.md-text-field {
  cursor: text;

  &__input-text {
    all: initial;
    color: var(--md-sys-color-on-surface);
    font-family: var(--md-sys-typescale-body-large-font);
    line-height: var(--md-sys-typescale-body-large-line-height);
    height: 1lh;
    min-width: 100%;
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

    .md-field-container_empty:not(:focus-within) & {
      opacity: 0;
      height: 0 !important;
      min-height: 0 !important;
    }

    .md-field-container_disabled & {
      pointer-events: none;
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-text-field:hover & {
      color: var(--md-sys-color-on-surface);
    }

    .md-text-field:focus-within & {
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
}
</style>
