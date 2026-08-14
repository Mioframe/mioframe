<script setup lang="ts">
import { sessionUniqueId } from '@shared/lib/uniqueId';
import { MDCheckbox } from '@shared/ui/material';
import { computed, useTemplateRef, watch } from 'vue';
import { toggleBoolean } from './toggleBoolean';

const modelValue = defineModel<boolean | undefined>();

const props = defineProps<{
  disabled?: boolean | undefined;
  label: string;
  indeterminate?: boolean | undefined;
  autofocus?: boolean | undefined;
}>();

const id = sessionUniqueId('BooleanPropertyField');

// MDCheckbox forwards `id`/`aria-label` to its rendered host element via $attrs (see
// ARCHITECTURE.md "Host-attribute boundary"); `id` supplies the `<label :for>` association and
// `aria-label` supplies the confirmed-working accessible-name backstop (M3E-005 in
// docs/m3e-defects.md — native `<label>` association alone does not produce an accessible name).
// Neither is a `data-*` attribute, so neither falls inside the project's `dataAttributes`
// allowlist, and both must go through `v-bind` to type-check against MDCheckbox's strictly typed
// props (matching the established `MDListItemDomContractStory.vue` precedent).
const hostAttrs = computed(() => ({ id, 'aria-label': props.label }));

/**
 * Translates the owned `boolean | undefined` tri-state vocabulary onto the canonical
 * `MDCheckbox`'s `checked`/`indeterminate` pair: `true` renders checked; `false` and
 * `undefined` both render unchecked, and `undefined` additionally renders indeterminate when
 * the `indeterminate` axis is enabled.
 */
const checked = computed(() => modelValue.value === true);
const showIndeterminate = computed(() => !!props.indeterminate && modelValue.value === undefined);

/**
 * A single real user activation fires `MDCheckbox`'s `update:checked`/`update:indeterminate`
 * pair together; this field owns its own tri-state cycle (`toggleBoolean`) rather than writing
 * back the renderer-derived binary values directly, so `update:checked` is used only as the
 * one-per-activation trigger and its value is intentionally not read.
 */
const onActivate = () => {
  modelValue.value = toggleBoolean(modelValue.value, props.indeterminate);
};

const checkboxRef = useTemplateRef<{ $el: HTMLElement }>('checkboxRef');

watch(
  [checkboxRef, () => props.autofocus, () => props.disabled],
  ([instance, autofocus, isDisabled]) => {
    // The checkbox host owns autofocus because inline boolean editors pass the
    // prop through MDCheckboxField and must focus the interactive checkbox host.
    if (autofocus && instance && !isDisabled) {
      instance.$el.focus();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="md-boolean-field">
    <!-- eslint-disable vue/no-restricted-v-bind -- transparent $attrs forwarding boundary (see script comment); `id`/`aria-label` are not `data-*` attributes so they cannot be written literally under this project's strict component typing -->
    <MDCheckbox
      ref="checkboxRef"
      v-bind="hostAttrs"
      :checked="checked"
      :indeterminate="showIndeterminate"
      :disabled="disabled"
      @update:checked="onActivate"
    />
    <!-- eslint-enable vue/no-restricted-v-bind -->

    <label class="md-boolean-field__label" :for="id">
      {{ label }}
    </label>
  </div>
</template>

<style lang="css" scoped>
.md-boolean-field {
  display: flex;
  align-items: center;
  gap: 16px;

  &__label {
    cursor: pointer;
  }
}
</style>
