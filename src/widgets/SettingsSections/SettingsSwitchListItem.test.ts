import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick } from 'vue';
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

const mountSettingsSwitchListItem = async ({
  checked = false,
  disabled = false,
  lines,
  onChange,
}: {
  checked?: boolean | undefined;
  disabled?: boolean | undefined;
  lines?: 1 | 2 | 3 | undefined;
  onChange?: (() => void) | undefined;
} = {}) => {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(SettingsSwitchListItem, {
    headline: 'Error diagnostics',
    supportingText: 'Send technical error reports after you enable diagnostics.',
    checked,
    disabled,
    lines,
    onChange,
  });

  app.mount(root);
  await nextTick();

  return {
    root,
    unmount: () => {
      app.unmount();
      root.remove();
    },
  };
};

const getSwitchRow = (root: HTMLElement) => root.querySelector<HTMLElement>('[role="switch"]');

describe('SettingsSwitchListItem', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders an enabled switch row as a single interactive switch control', async () => {
    const onChange = vi.fn();
    const { root, unmount } = await mountSettingsSwitchListItem({ onChange });

    const row = getSwitchRow(root);

    expect(row?.tagName).toBe('BUTTON');
    expect(row?.getAttribute('aria-checked')).toBe('false');
    expect(row?.querySelector('input')).toBeNull();
    expect(row?.querySelector('label')).toBeNull();

    const visualSwitch = row?.querySelector<HTMLElement>('.md-switch');
    expect(visualSwitch).not.toBeNull();
    expect(visualSwitch?.querySelector('input')).toBeNull();
    expect(visualSwitch?.hasAttribute('tabindex')).toBe(false);

    row?.click();
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('renders a disabled checked row as non-interactive with aria-disabled', async () => {
    const onChange = vi.fn();
    const { root, unmount } = await mountSettingsSwitchListItem({
      checked: true,
      disabled: true,
      onChange,
    });

    const row = getSwitchRow(root);

    expect(row?.tagName).toBe('BUTTON');
    expect(row?.getAttribute('aria-checked')).toBe('true');
    expect(row?.getAttribute('aria-disabled')).toBe('true');

    row?.click();
    await nextTick();

    expect(onChange).not.toHaveBeenCalled();

    unmount();
  });

  it('forwards lines prop to MDListItem', async () => {
    const { root, unmount } = await mountSettingsSwitchListItem({ lines: 2 });

    const row = getSwitchRow(root);
    expect(row?.getAttribute('data-line-count')).toBe('2');

    unmount();
  });
});
