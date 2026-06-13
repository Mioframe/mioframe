import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import SettingsCheckboxListItem from './SettingsCheckboxListItem.vue';

vi.mock('@shared/ui/State/useRipple', () => ({
  useRipple: () => undefined,
}));

vi.mock('@shared/ui/ProgressIndicators', () => ({
  MDCircularProgressIndicator: {
    name: 'MDCircularProgressIndicatorStub',
    props: ['size'],
    template: '<div data-testid="loading-indicator" />',
  },
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
      selected: { type: Boolean, default: false },
    },
    emits: ['action'],
    setup(
      props: {
        labelText: string;
        mode: string;
        disabled?: boolean;
        lineCount?: number;
        selected?: boolean;
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
            'data-selected': props.selected ? 'true' : 'false',
            onClick: (e: MouseEvent) => {
              if (!props.disabled) emit('action', e);
            },
          },
          [h('span', props.labelText), slots.trailing?.()],
        );
    },
  },
}));

const mountSettingsCheckboxListItem = async ({
  checked = false,
  disabled = false,
  loading = false,
  lines,
  onChange,
}: {
  checked?: boolean | undefined;
  disabled?: boolean | undefined;
  loading?: boolean | undefined;
  lines?: 1 | 2 | 3 | undefined;
  onChange?: (() => void) | undefined;
} = {}) => {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(SettingsCheckboxListItem, {
    headline: 'Google Drive',
    supportingText: 'Connect Google Drive accounts to open files you choose.',
    checked,
    disabled,
    loading,
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

const getCheckboxRow = (root: HTMLElement) => root.querySelector<HTMLElement>('[role="checkbox"]');

describe('SettingsCheckboxListItem', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders an enabled checkbox row as a single interactive checkbox control', async () => {
    const onChange = vi.fn();
    const { root, unmount } = await mountSettingsCheckboxListItem({ onChange });

    const row = getCheckboxRow(root);

    expect(row?.tagName).toBe('BUTTON');
    expect(row?.getAttribute('aria-checked')).toBe('false');
    expect(row?.querySelector('input')).toBeNull();
    expect(row?.querySelector('label')).toBeNull();
    expect(row?.querySelectorAll('button')).toHaveLength(0);

    const visualCheckbox = row?.querySelector<HTMLElement>('.md-checkbox');
    expect(visualCheckbox).not.toBeNull();
    expect(visualCheckbox?.querySelector('input')).toBeNull();
    expect(visualCheckbox?.querySelector('label')).toBeNull();
    expect(visualCheckbox?.hasAttribute('tabindex')).toBe(false);

    row?.click();
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('renders a disabled checked row as non-interactive with aria-disabled', async () => {
    const onChange = vi.fn();
    const { root, unmount } = await mountSettingsCheckboxListItem({
      checked: true,
      disabled: true,
      onChange,
    });

    const row = getCheckboxRow(root);

    expect(row?.tagName).toBe('BUTTON');
    expect(row?.getAttribute('aria-checked')).toBe('true');
    expect(row?.getAttribute('aria-disabled')).toBe('true');
    expect(row?.hasAttribute('tabindex')).toBe(false);

    row?.click();
    await nextTick();

    expect(onChange).not.toHaveBeenCalled();

    unmount();
  });

  it('renders a loading row as non-interactive with loading indicator instead of checkbox', async () => {
    const onChange = vi.fn();
    const { root, unmount } = await mountSettingsCheckboxListItem({
      loading: true,
      onChange,
    });

    const row = getCheckboxRow(root);

    expect(row?.tagName).toBe('BUTTON');
    expect(row?.getAttribute('aria-busy')).toBe('true');
    expect(row?.getAttribute('aria-disabled')).toBe('true');
    // loading indicator present
    expect(root.querySelector('[data-testid="loading-indicator"]')).not.toBeNull();
    // no presentation checkbox
    expect(root.querySelector('.md-checkbox')).toBeNull();

    row?.click();
    await nextTick();

    expect(onChange).not.toHaveBeenCalled();

    unmount();
  });

  it('forwards lines prop to MDListItem', async () => {
    const { root, unmount } = await mountSettingsCheckboxListItem({ lines: 2 });

    const row = root.querySelector<HTMLElement>('[role="checkbox"]');
    expect(row?.getAttribute('data-line-count')).toBe('2');

    unmount();
  });
});
