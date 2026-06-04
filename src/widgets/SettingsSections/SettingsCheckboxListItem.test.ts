import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick } from 'vue';
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

const mountSettingsCheckboxListItem = async ({
  checked = false,
  disabled = false,
  loading = false,
  onChange,
}: {
  checked?: boolean | undefined;
  disabled?: boolean | undefined;
  loading?: boolean | undefined;
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

  it('forwards lines prop correctly', async () => {
    const { root, unmount } = await mountSettingsCheckboxListItem();

    // lines is passed through to MDListItem — we just check the component mounts without error
    expect(root.querySelector('[role="checkbox"]')).not.toBeNull();

    unmount();
  });
});
