/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import BooleanValueInline from './BooleanValueInline.vue';
import type { BooleanProperty } from './boolean';

/**
 * Stubs the canonical `MDCheckbox` (`@shared/ui/material`) with the minimal reflective contract
 * `BooleanValueInline` relies on: `checked`/`indeterminate` reflection only. `MDCheckbox`'s own
 * renderer mapping is proven once at `components/checkbox/MDCheckbox.test.ts`; this file proves
 * only `BooleanValueInline`'s own legacy-capability-flag-to-canonical-rendered-state translation.
 */
const MDCheckboxStub = defineComponent({
  name: 'MDCheckboxStub',
  props: {
    checked: { type: Boolean, default: false },
    indeterminate: { type: Boolean, default: false },
    presentation: { type: Boolean, default: false },
  },
  setup(props) {
    return () =>
      h('div', {
        class: 'md-checkbox-stub',
        'data-checked': props.checked ? 'true' : 'false',
        'data-indeterminate': props.indeterminate ? 'true' : 'false',
        'data-presentation': props.presentation ? 'true' : 'false',
      });
  },
});

const MDPlainTooltipStub = defineComponent({
  name: 'MDPlainTooltipStub',
  props: {
    text: { type: String, default: '' },
  },
  setup() {
    return () => h('div', { class: 'md-plain-tooltip-stub' });
  },
});

const createProperty = (overrides: Partial<BooleanProperty> = {}): BooleanProperty => ({
  name: 'Active',
  type: 'boolean',
  ...overrides,
});

const mountInline = (props: { value: unknown; property: BooleanProperty }) =>
  mount(BooleanValueInline, {
    props,
    global: {
      stubs: {
        MDCheckbox: MDCheckboxStub,
        MDPlainTooltip: MDPlainTooltipStub,
      },
    },
  });

describe('BooleanValueInline', () => {
  it('renders checked=true, indeterminate=false for an effective true value with the indeterminate capability enabled', () => {
    const wrapper = mountInline({
      value: true,
      property: createProperty({ indeterminate: true }),
    });
    const checkbox = wrapper.get('.md-checkbox-stub');

    expect(checkbox.attributes('data-checked')).toBe('true');
    expect(checkbox.attributes('data-indeterminate')).toBe('false');
  });

  it('renders checked=false, indeterminate=false for an effective false value with the indeterminate capability enabled', () => {
    const wrapper = mountInline({
      value: false,
      property: createProperty({ indeterminate: true }),
    });
    const checkbox = wrapper.get('.md-checkbox-stub');

    expect(checkbox.attributes('data-checked')).toBe('false');
    expect(checkbox.attributes('data-indeterminate')).toBe('false');
  });

  it('renders checked=false, indeterminate=true for an undefined value with no default and the indeterminate capability enabled', () => {
    const wrapper = mountInline({
      value: undefined,
      property: createProperty({ indeterminate: true }),
    });
    const checkbox = wrapper.get('.md-checkbox-stub');

    expect(checkbox.attributes('data-checked')).toBe('false');
    expect(checkbox.attributes('data-indeterminate')).toBe('true');
  });

  it('resolves an undefined value through a true property default to checked=true, indeterminate=false', () => {
    const wrapper = mountInline({
      value: undefined,
      property: createProperty({ indeterminate: true, default: true }),
    });
    const checkbox = wrapper.get('.md-checkbox-stub');

    expect(checkbox.attributes('data-checked')).toBe('true');
    expect(checkbox.attributes('data-indeterminate')).toBe('false');
  });

  it('resolves an undefined value through a false property default to checked=false, indeterminate=false', () => {
    const wrapper = mountInline({
      value: undefined,
      property: createProperty({ indeterminate: true, default: false }),
    });
    const checkbox = wrapper.get('.md-checkbox-stub');

    expect(checkbox.attributes('data-checked')).toBe('false');
    expect(checkbox.attributes('data-indeterminate')).toBe('false');
  });

  it('renders checked=false, indeterminate=false for an undefined value with no default and the indeterminate capability disabled', () => {
    const wrapper = mountInline({
      value: undefined,
      property: createProperty({ indeterminate: false }),
    });
    const checkbox = wrapper.get('.md-checkbox-stub');

    expect(checkbox.attributes('data-checked')).toBe('false');
    expect(checkbox.attributes('data-indeterminate')).toBe('false');
  });

  it('always renders the composed checkbox as presentation-only', () => {
    const wrapper = mountInline({
      value: true,
      property: createProperty(),
    });

    expect(wrapper.get('.md-checkbox-stub').attributes('data-presentation')).toBe('true');
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
