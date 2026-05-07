/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';

const settings = ref<{ googleDriveIntegrationEnabled?: boolean }>({});
let googleDriveIntegrationAvailable = true;

vi.mock('./useLocalSettings', () => ({
  useLocalSettings: () => ({
    settings,
    SETTINGS_DESCRIPTION: {
      hideStarterWidget: 'Hide starter examples on the home screen',
      showPerformance: 'Show performance layer',
      googleDriveIntegrationEnabled: 'Enable optional Google Drive integration',
      showAutomergeFiles: 'Show *.automerge files in explorer',
    },
    SETTINGS_LABEL: {
      hideStarterWidget: 'Hide starter examples',
      showPerformance: 'Performance layer',
      googleDriveIntegrationEnabled: 'Google Drive',
      showAutomergeFiles: 'Show *.automerge files',
    },
  }),
}));

vi.mock('@shared/config', () => ({
  get GOOGLE_DRIVE_INTEGRATION_AVAILABLE() {
    return googleDriveIntegrationAvailable;
  },
}));

vi.mock('@shared/ui/Lists', () => ({
  MDListContainer: defineComponent({
    name: 'MDListContainerStub',
    setup(_props, { slots }) {
      return () => h('div', { 'data-testid': 'list-container' }, slots.default?.());
    },
  }),
  MDListItem: defineComponent({
    name: 'MDListItemStub',
    props: {
      headline: {
        type: String,
        required: true,
      },
      is: {
        type: String,
        default: 'div',
      },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          props.is,
          {
            'data-testid': `list-item-${props.headline}`,
            onClick: () => {
              emit('click');
            },
          },
          [
            h('span', { 'data-testid': `headline-${props.headline}` }, props.headline),
            slots.supportingText?.(),
            slots.trailingIcon?.(),
          ],
        );
    },
  }),
}));

vi.mock('@shared/ui/Checkbox', () => ({
  MDCheckbox: defineComponent({
    name: 'MDCheckboxStub',
    props: {
      modelValue: {
        type: Boolean,
        default: undefined,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      readonly: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-testid': 'google-drive-checkbox',
          'data-model-value': String(props.modelValue),
          'data-disabled': String(props.disabled),
          'data-readonly': String(props.readonly),
        });
    },
  }),
}));

const mountLocalSettingsList = async () => {
  const { default: LocalSettingsList } = await import('./LocalSettingsList.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(LocalSettingsList);

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

describe('LocalSettingsList', () => {
  afterEach(() => {
    vi.resetModules();
    googleDriveIntegrationAvailable = true;
    settings.value = {};
    document.body.innerHTML = '';
  });

  it('keeps Google Drive disabled in settings when integration is unavailable', async () => {
    googleDriveIntegrationAvailable = false;
    settings.value = {
      googleDriveIntegrationEnabled: true,
    };

    const { root, unmount } = await mountLocalSettingsList();
    const item = root.querySelector('[data-testid="list-item-Google Drive"]');
    const checkbox = item?.querySelector('[data-testid="google-drive-checkbox"]');

    expect(root.textContent).toContain('Google Drive integration is not configured');
    expect(checkbox?.getAttribute('data-model-value')).toBe('false');
    expect(checkbox?.getAttribute('data-disabled')).toBe('true');
    expect(checkbox?.getAttribute('data-readonly')).toBe('true');

    item?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(settings.value.googleDriveIntegrationEnabled).toBe(true);

    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
