import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import MDCheckboxField from './MDCheckboxField.vue';

/**
 * Stubs the canonical `MDCheckbox` (`@shared/ui/material`) with the minimal composed contract
 * `MDCheckboxField` relies on: `checked`/`indeterminate`/`disabled` reflection, a real focusable
 * `$el` for the autofocus wiring, and one `update:checked`/`update:indeterminate` intent pair per
 * simulated activation. `MDCheckbox`'s own renderer mapping is proven once at
 * `components/checkbox/MDCheckbox.test.ts`; this file proves only `MDCheckboxField`'s own
 * tri-state translation, accessible-name backstop, and autofocus composition.
 */
const MDCheckboxStub = defineComponent({
  name: 'MDCheckboxStub',
  props: {
    checked: { type: Boolean, default: false },
    indeterminate: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:checked', 'update:indeterminate'],
  setup(props, { emit, attrs }) {
    return () =>
      h('div', {
        ...attrs,
        class: 'md-checkbox-stub',
        'data-checked': props.checked ? 'true' : 'false',
        'data-indeterminate': props.indeterminate ? 'true' : 'false',
        'data-disabled': props.disabled ? 'true' : 'false',
        onClick: () => {
          if (props.disabled) {
            return;
          }
          emit('update:checked', !props.checked);
          emit('update:indeterminate', false);
        },
      });
  },
});

const mountField = (props: Record<string, unknown> = {}) =>
  mount(MDCheckboxField, {
    props: {
      label: 'Enabled',
      ...props,
    },
    global: {
      stubs: {
        MDCheckbox: MDCheckboxStub,
      },
    },
    attachTo: document.body,
  });

describe('MDCheckboxField', () => {
  it('reflects a true modelValue as checked, non-indeterminate', () => {
    const wrapper = mountField({ modelValue: true });
    const checkbox = wrapper.get('.md-checkbox-stub');

    expect(checkbox.attributes('data-checked')).toBe('true');
    expect(checkbox.attributes('data-indeterminate')).toBe('false');
  });

  it('reflects a false modelValue as unchecked, non-indeterminate', () => {
    const wrapper = mountField({ modelValue: false });
    const checkbox = wrapper.get('.md-checkbox-stub');

    expect(checkbox.attributes('data-checked')).toBe('false');
    expect(checkbox.attributes('data-indeterminate')).toBe('false');
  });

  it('reflects an undefined modelValue as indeterminate only when the tri-state axis is enabled', () => {
    const wrapper = mountField({ modelValue: undefined, indeterminate: true });
    const checkbox = wrapper.get('.md-checkbox-stub');

    expect(checkbox.attributes('data-checked')).toBe('false');
    expect(checkbox.attributes('data-indeterminate')).toBe('true');
  });

  it('does not render indeterminate for an undefined modelValue when the tri-state axis is disabled', () => {
    const wrapper = mountField({ modelValue: undefined, indeterminate: false });

    expect(wrapper.get('.md-checkbox-stub').attributes('data-indeterminate')).toBe('false');
  });

  it('cycles the binary true/false modelValue on activation when the tri-state axis is disabled', async () => {
    const wrapper = mountField({ modelValue: false, indeterminate: false });

    await wrapper.get('.md-checkbox-stub').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
  });

  it('cycles true -> undefined -> false through the tri-state axis on activation', async () => {
    const wrapper = mountField({ modelValue: true, indeterminate: true });

    await wrapper.get('.md-checkbox-stub').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([undefined]);
  });

  it('forwards disabled to the composed checkbox', () => {
    const wrapper = mountField({ disabled: true });

    expect(wrapper.get('.md-checkbox-stub').attributes('data-disabled')).toBe('true');
  });

  it('does not toggle on activation while disabled', async () => {
    const wrapper = mountField({ modelValue: false, disabled: true });

    await wrapper.get('.md-checkbox-stub').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('forwards the label text as the composed checkbox accessible-name backstop', () => {
    const wrapper = mountField({ label: 'Send receipts' });

    expect(wrapper.get('.md-checkbox-stub').attributes('aria-label')).toBe('Send receipts');
  });

  it('associates the external label with the composed checkbox host id', () => {
    const wrapper = mountField();
    const id = wrapper.get('.md-checkbox-stub').attributes('id');

    expect(id).toBeTruthy();
    expect(wrapper.get('label').attributes('for')).toBe(id);
  });

  it('focuses the composed checkbox on mount when autofocus is set and not disabled', async () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');

    mountField({ autofocus: true });
    await nextTick();

    expect(focusSpy).toHaveBeenCalled();

    focusSpy.mockRestore();
  });

  it('does not focus the composed checkbox on mount when disabled', async () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');

    mountField({ autofocus: true, disabled: true });
    await nextTick();

    expect(focusSpy).not.toHaveBeenCalled();

    focusSpy.mockRestore();
  });
});
