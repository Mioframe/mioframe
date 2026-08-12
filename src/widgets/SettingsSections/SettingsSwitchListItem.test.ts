import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import SettingsSwitchListItem from './SettingsSwitchListItem.vue';

vi.mock('@shared/ui/State/useRipple', () => ({
  useRipple: () => undefined,
}));

vi.mock('@shared/ui/material', () => ({
  MDSwitch: defineComponent({
    name: 'MDSwitchStub',
    props: {
      selected: { type: Boolean, default: false },
      disabled: { type: Boolean, default: false },
      presentation: { type: Boolean, default: false },
    },
    setup(props) {
      return () =>
        h('div', {
          class: 'md-switch',
          'data-presentation': props.presentation ? 'true' : 'false',
          'data-state': props.selected ? 'checked' : 'unchecked',
          'data-disabled': props.disabled ? 'true' : 'false',
        });
    },
  }),
}));

vi.mock('@shared/ui/Lists', () => ({
  MDListItem: {
    name: 'MDListItemStub',
    inheritAttrs: false,
    props: {
      labelText: { type: String, required: true },
      mode: { type: String, default: 'static' },
      disabled: { type: Boolean, default: false },
      lineCount: { type: Number, default: undefined },
    },
    emits: ['action'],
    setup(
      props: {
        labelText: string;
        mode: string;
        disabled?: boolean;
        lineCount?: number;
      },
      {
        attrs,
        emit,
        slots,
      }: {
        attrs: Record<string, unknown>;
        emit: (event: string, ...args: unknown[]) => void;
        slots: Record<string, (() => ReturnType<typeof h>) | undefined>;
      },
    ) {
      return () =>
        h(
          props.mode === 'single-action' ? 'button' : 'div',
          {
            ...attrs,
            'data-line-count': props.lineCount,
            onClick: (e: MouseEvent) => {
              if (!props.disabled) emit('action', e);
            },
          },
          [h('span', props.labelText), slots.trailing?.()],
        );
    },
  },
}));

const mountSettingsSwitchListItem = ({
  checked = false,
  disabled = false,
  lines,
}: {
  checked?: boolean | undefined;
  disabled?: boolean | undefined;
  lines?: 1 | 2 | 3 | undefined;
} = {}) =>
  mount(SettingsSwitchListItem, {
    props: {
      headline: 'Error diagnostics',
      supportingText: 'Send technical error reports after you enable diagnostics.',
      checked,
      disabled,
      ...(lines === undefined ? {} : { lines }),
    },
  });

describe('SettingsSwitchListItem', () => {
  it('renders an enabled switch row as a single interactive switch control', async () => {
    const wrapper = mountSettingsSwitchListItem();

    const row = wrapper.get('[role="switch"]');

    expect(row.element.tagName).toBe('BUTTON');
    expect(row.attributes('aria-checked')).toBe('false');
    expect(row.find('input').exists()).toBe(false);
    expect(row.find('label').exists()).toBe(false);

    // The list item owns the switch role, aria-checked, and the click action;
    // the trailing MDSwitch visual is purely reflective (presentation) and
    // must never carry its own accessible name or interactivity. MDSwitch's
    // own tabindex/aria-hidden suppression mechanics are proven by its own
    // component-contract tests, not re-verified here.
    const visualSwitch = row.get('.md-switch');
    expect(visualSwitch.attributes('data-presentation')).toBe('true');
    expect(visualSwitch.attributes('data-state')).toBe('unchecked');
    expect(visualSwitch.attributes('data-disabled')).toBe('false');

    await row.trigger('click');
    expect(wrapper.emitted('change')).toHaveLength(1);
  });

  it('renders a disabled checked row as non-interactive with aria-disabled', async () => {
    const wrapper = mountSettingsSwitchListItem({
      checked: true,
      disabled: true,
    });

    const row = wrapper.get('[role="switch"]');

    expect(row.element.tagName).toBe('BUTTON');
    expect(row.attributes('aria-checked')).toBe('true');
    expect(row.attributes('aria-disabled')).toBe('true');

    const visualSwitch = row.get('.md-switch');
    expect(visualSwitch.attributes('data-state')).toBe('checked');
    expect(visualSwitch.attributes('data-disabled')).toBe('true');

    await row.trigger('click');

    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('forwards lines prop to MDListItem', () => {
    const wrapper = mountSettingsSwitchListItem({ lines: 2 });

    const row = wrapper.get('[role="switch"]');
    expect(row.attributes('data-line-count')).toBe('2');
  });
});
