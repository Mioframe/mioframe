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
      headline: { type: String, required: true },
      is: { type: String, default: 'div' },
      type: { default: undefined },
      itemRole: { type: String, default: undefined },
      disabled: { type: Boolean, default: false },
      lines: { type: Number, default: undefined },
    },
    emits: ['click', 'keydown'],
    setup(
      props: {
        headline: string;
        is: string;
        type: unknown;
        itemRole?: string;
        disabled?: boolean;
        lines?: number;
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
          props.is,
          {
            ...attrs,
            role: props.itemRole ?? undefined,
            type: typeof props.type === 'string' ? props.type : undefined,
            'data-lines': props.lines,
            onClick: (e: MouseEvent) => {
              if (!props.disabled) emit('click', e);
            },
            onKeydown: (e: KeyboardEvent) => {
              if (!props.disabled) emit('keydown', e);
            },
          },
          [slots['supportingText']?.(), slots['trailingIcon']?.()],
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
    expect(row?.getAttribute('type')).toBe('button');
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

    row?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(2);

    row?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(3);

    row?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(3);

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

    expect(row?.tagName).toBe('DIV');
    expect(row?.getAttribute('aria-checked')).toBe('true');
    expect(row?.getAttribute('aria-disabled')).toBe('true');
    expect(row?.hasAttribute('tabindex')).toBe(false);

    row?.click();
    row?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    row?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
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

    expect(row?.tagName).toBe('DIV');
    expect(row?.getAttribute('aria-busy')).toBe('true');
    expect(row?.getAttribute('aria-disabled')).toBe('true');
    // loading indicator present
    expect(root.querySelector('[data-testid="loading-indicator"]')).not.toBeNull();
    // no presentation checkbox
    expect(root.querySelector('.md-checkbox')).toBeNull();

    row?.click();
    row?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    row?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await nextTick();

    expect(onChange).not.toHaveBeenCalled();

    unmount();
  });

  it('forwards lines prop to MDListItem', async () => {
    const { root, unmount } = await mountSettingsCheckboxListItem({ lines: 2 });

    const row = root.querySelector<HTMLElement>('[role="checkbox"]');
    expect(row?.getAttribute('data-lines')).toBe('2');

    unmount();
  });
});
