import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import SettingsSwitchListItem from './SettingsSwitchListItem.vue';

vi.mock('@shared/ui/State/useRipple', () => ({
  useRipple: () => undefined,
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
  onChange,
}: {
  checked?: boolean | undefined;
  disabled?: boolean | undefined;
  lines?: 1 | 2 | 3 | undefined;
  onChange?: (() => void) | undefined;
} = {}) =>
  mount(SettingsSwitchListItem, {
    props: {
      headline: 'Error diagnostics',
      supportingText: 'Send technical error reports after you enable diagnostics.',
      checked,
      disabled,
      ...(lines === undefined ? {} : { lines }),
      ...(onChange === undefined ? {} : { onChange }),
    },
  });

describe('SettingsSwitchListItem', () => {
  it('renders an enabled switch row as a single interactive switch control', async () => {
    const onChange = vi.fn();
    const wrapper = mountSettingsSwitchListItem({ onChange });

    const row = wrapper.get('[role="switch"]');

    expect(row.element.tagName).toBe('BUTTON');
    expect(row.attributes('aria-checked')).toBe('false');
    expect(row.find('input').exists()).toBe(false);
    expect(row.find('label').exists()).toBe(false);

    const visualSwitch = row.get('.md-switch');
    expect(visualSwitch.find('input').exists()).toBe(false);
    expect(visualSwitch.attributes('tabindex')).toBeUndefined();

    await row.trigger('click');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('renders a disabled checked row as non-interactive with aria-disabled', async () => {
    const onChange = vi.fn();
    const wrapper = mountSettingsSwitchListItem({
      checked: true,
      disabled: true,
      onChange,
    });

    const row = wrapper.get('[role="switch"]');

    expect(row.element.tagName).toBe('BUTTON');
    expect(row.attributes('aria-checked')).toBe('true');
    expect(row.attributes('aria-disabled')).toBe('true');

    await row.trigger('click');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards lines prop to MDListItem', () => {
    const wrapper = mountSettingsSwitchListItem({ lines: 2 });

    const row = wrapper.get('[role="switch"]');
    expect(row.attributes('data-line-count')).toBe('2');
  });
});
