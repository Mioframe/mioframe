/* eslint-disable vue/one-component-per-file -- This test file mounts small inline Vue apps to verify primitive behavior. */
import { afterEach, describe, expect, it } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import MDCheckbox from './MDCheckbox.vue';

const mountCheckbox = async (props: Record<string, unknown>) => {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp({
    render: () => h(MDCheckbox, props),
  });

  app.mount(root);
  await nextTick();

  const checkbox = root.querySelector('.md-checkbox');
  if (!checkbox) {
    throw new Error('MDCheckbox root element was not rendered');
  }

  return {
    root,
    checkbox,
    unmount: () => {
      app.unmount();
      root.remove();
    },
  };
};

describe('MDCheckbox', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses ariaLabel as the focusable container label when tooltip is absent', async () => {
    const { checkbox, unmount } = await mountCheckbox({
      ariaLabel: 'Enable sync',
    });

    expect(checkbox.getAttribute('aria-label')).toBe('Enable sync');

    unmount();
  });

  it('prefers tooltip over ariaLabel on the focusable container', async () => {
    const { checkbox, unmount } = await mountCheckbox({
      ariaLabel: 'Enable sync',
      tooltip: 'Sync with Google Drive',
    });

    expect(checkbox.getAttribute('aria-label')).toBe('Sync with Google Drive');

    unmount();
  });

  it('renders a native input in the default interactive mode', async () => {
    const { root, unmount } = await mountCheckbox({
      modelValue: true,
      ariaLabel: 'Enable sync',
    });

    expect(root.querySelector('input[type="checkbox"]')).not.toBeNull();

    unmount();
  });

  it('renders a non-interactive aria-hidden checkbox in presentation mode', async () => {
    const { root, checkbox, unmount } = await mountCheckbox({
      modelValue: true,
      ariaLabel: 'Enable sync',
      presentation: true,
    });

    expect(root.querySelector('input[type="checkbox"]')).toBeNull();
    expect(checkbox.tagName).toBe('DIV');
    expect(checkbox.getAttribute('aria-hidden')).toBe('true');
    expect(checkbox.hasAttribute('tabindex')).toBe(false);
    expect(checkbox.classList.contains('md-state')).toBe(false);
    expect(root.querySelector('.md-state-layer')).toBeNull();
    expect(root.querySelector('.md-state-layer__target')).toBeNull();

    unmount();
  });

  it('does not emit toggle behavior from presentation mode interactions', async () => {
    const updates: Array<boolean | undefined> = [];
    let clicks = 0;
    const root = document.createElement('div');
    document.body.appendChild(root);
    const app = createApp({
      render: () =>
        h(MDCheckbox, {
          modelValue: false,
          ariaLabel: 'Enable sync',
          presentation: true,
          onClick: () => {
            clicks += 1;
          },
          'onUpdate:modelValue': (value: boolean | undefined) => {
            updates.push(value);
          },
        }),
    });

    app.mount(root);
    await nextTick();

    const checkbox = root.querySelector<HTMLElement>('.md-checkbox');
    if (!checkbox) {
      throw new Error('MDCheckbox root element was not rendered');
    }

    checkbox.click();
    checkbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    checkbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await nextTick();

    expect(clicks).toBe(0);
    expect(updates).toEqual([]);

    app.unmount();
    root.remove();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline test app definitions. */
