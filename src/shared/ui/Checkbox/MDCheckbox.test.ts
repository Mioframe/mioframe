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

  const checkbox = root.querySelector('label.md-checkbox');
  if (!checkbox) {
    throw new Error('MDCheckbox root label was not rendered');
  }

  return {
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
});
