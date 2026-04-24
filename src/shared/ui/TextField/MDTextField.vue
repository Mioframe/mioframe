<script setup lang="ts">
import { computed, toRefs, useTemplateRef, watch } from 'vue';
import { useTextareaAutosize } from '@vueuse/core';
import { toString } from 'es-toolkit/compat';
import MDFieldContainer from './MDFieldContainer.vue';

const modelValue = defineModel<string | undefined>();

const props = withDefaults(
  defineProps<{
    labelText: string;
    supportingText?: string | undefined;
    type?: 'filled' | 'outlined' | undefined;
    disabled?: boolean | undefined;
    error?: boolean | undefined;
    maxCharacters?: number | undefined;
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
      | 'multiline'
      | undefined;
    readonly?: boolean | undefined;
    autofocus?: boolean | undefined;
    size?: number | undefined;
  }>(),
  { inputType: 'text', type: 'outlined' },
);

const emit = defineEmits<{
  focus: [e: FocusEvent];
  keydown: [payload: KeyboardEvent];
}>();

const slots = defineSlots<{
  leadingIcon(): unknown;
  trailingIcon(): unknown;
}>();

const { inputType, type, autofocus } = toRefs(props);

const inputRef = useTemplateRef('inputRef');

const modelValueString = computed(() => toString(modelValue.value));

const onFocus = (event: FocusEvent) => {
  emit('focus', event);
};

const onKeydown = (event: KeyboardEvent) => {
  emit('keydown', event);
};

useTextareaAutosize({
  element: computed(() =>
    inputRef.value instanceof HTMLTextAreaElement ? inputRef.value : undefined,
  ),
  input: computed(() => modelValueString.value),
  styleProp: 'minHeight',
});

watch(
  [inputRef, autofocus],
  ([input, shouldAutofocus]) => {
    if (shouldAutofocus && input instanceof HTMLElement) {
      input.focus();
    }
  },
  { immediate: true },
);
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
        class="md-text-field__input-text md-focus-indicator_hidden"
        :disabled="disabled"
        :maxlength="maxCharacters"
        :readonly="readonly"
        @focus="onFocus"
        @keydown="onKeydown"
      />

      <input
        v-else
        :id="id"
        ref="inputRef"
        v-model="modelValue"
        class="md-text-field__input-text md-focus-indicator_hidden"
        :disabled="disabled"
        :maxlength="maxCharacters"
        :type="inputType"
        :readonly="readonly"
        :size="size"
        @focus="onFocus"
        @keydown="onKeydown"
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
    transition-duration: var(--md-sys-motion-duration-short4);
    transition-timing-function: var(--md-sys-motion-easing-standard-index);
    cursor: text;
    white-space: pre;
    scrollbar-width: none;

    textarea& {
      transition-property: height;
    }

    .md-text-field.md-field-container_disabled & {
      pointer-events: none;
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-text-field.md-text-field:hover & {
      color: var(--md-sys-color-on-surface);
    }

    .md-text-field:focus-within & {
      color: var(--md-sys-color-on-surface);
    }

    .md-text-field.md-field-container_error & {
      color: var(--md-sys-color-on-surface);
      caret-color: var(--md-sys-color-error);
    }

    .md-text-field.md-field-container_error:hover & {
      color: var(--md-sys-color-on-surface);
    }
  }
}
</style>
