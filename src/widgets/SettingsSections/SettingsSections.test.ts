/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';

const settings = ref<{
  googleDriveIntegrationEnabled?: boolean;
  hideStarterWidget?: boolean;
}>({});
let googleDriveIntegrationAvailable = true;

vi.mock('@entity/localSettings', () => ({
  useLocalSettings: () => ({
    settings,
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
      return () => h('div', { role: 'list' }, slots.default?.());
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
        required: true,
      },
      type: {
        type: [String, Boolean],
        default: undefined,
      },
      itemRole: {
        type: String,
        default: undefined,
      },
    },
    emits: ['click', 'keydown'],
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          props.is,
          {
            ...attrs,
            type: typeof props.type === 'string' ? props.type : undefined,
            role: props.itemRole ?? 'listitem',
            onClick:
              props.is === 'button'
                ? () => {
                    emit('click');
                  }
                : undefined,
            onKeydown:
              props.is === 'button'
                ? (event: KeyboardEvent) => {
                    emit('keydown', event);
                  }
                : undefined,
          },
          [h('span', props.headline), slots.supportingText?.(), slots.trailingIcon?.()],
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
        required: true,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      presentation: {
        type: Boolean,
        default: false,
      },
      ariaLabel: {
        type: String,
        default: undefined,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const onChange = () => {
        if (props.disabled) {
          return;
        }

        emit('update:modelValue', !props.modelValue);
      };

      return () =>
        props.presentation
          ? h('div', {
              'aria-hidden': 'true',
              'data-state': props.modelValue ? 'checked' : 'unchecked',
              'data-disabled': props.disabled ? 'true' : 'false',
            })
          : h('input', {
              type: 'checkbox',
              checked: props.modelValue,
              disabled: props.disabled,
              'aria-label': props.ariaLabel,
              onClick: (event: MouseEvent) => {
                event.stopPropagation();
                onChange();
              },
              onKeydown: (event: KeyboardEvent) => {
                if (!['Enter', ' '].includes(event.key)) {
                  return;
                }

                event.preventDefault();
                onChange();
              },
            });
    },
  }),
}));

const mountSettingsSections = async ({
  onSelectDataStoragePrivacy,
}: {
  onSelectDataStoragePrivacy?: (() => void) | undefined;
} = {}) => {
  const { SettingsSections } = await import('./index');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(SettingsSections, {
    onSelectDataStoragePrivacy,
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

const getButtonByText = (root: HTMLElement, text: string) =>
  Array.from(root.querySelectorAll('button')).find((button) => button.textContent.includes(text)) ??
  null;

const getCheckboxRow = (root: HTMLElement, label: string) =>
  Array.from(root.querySelectorAll<HTMLElement>('[role="checkbox"]')).find((element) =>
    element.textContent.includes(label),
  ) ?? null;

const getVisualCheckbox = (root: HTMLElement, label: string) =>
  Array.from(root.querySelectorAll<HTMLElement>('[aria-hidden="true"]')).find((element) =>
    (element.parentElement?.parentElement?.textContent ?? '').includes(label),
  ) ?? null;

const getStaticRowByText = (root: HTMLElement, text: string) =>
  Array.from(root.querySelectorAll('div')).find((element) => element.textContent.includes(text)) ??
  null;

describe('SettingsSections', () => {
  afterEach(() => {
    vi.resetModules();
    googleDriveIntegrationAvailable = true;
    settings.value = {};
    document.body.innerHTML = '';
  });

  it('renders the four release settings sections and opens privacy help from Help', async () => {
    const onSelectDataStoragePrivacy = vi.fn();
    const { root, unmount } = await mountSettingsSections({ onSelectDataStoragePrivacy });

    expect(root.textContent).toContain('Privacy & diagnostics');
    expect(root.textContent).toContain('Integrations');
    expect(root.textContent).toContain('Home screen');
    expect(root.textContent).toContain('Help');
    expect(root.textContent).toContain('Diagnostics are not available in this build.');
    expect(root.textContent).toContain(
      'Learn where your data is stored and what can leave this device.',
    );

    getButtonByText(root, 'Data storage and privacy')?.click();
    await nextTick();

    expect(onSelectDataStoragePrivacy).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('toggles Google Drive between true and undefined with row click and keyboard', async () => {
    const { root, unmount } = await mountSettingsSections();
    const googleDriveRow = getCheckboxRow(root, 'Google Drive');

    expect(googleDriveRow?.getAttribute('aria-checked')).toBe('false');
    expect(getVisualCheckbox(root, 'Google Drive')).not.toBeNull();
    expect(root.querySelector('input[type="checkbox"][aria-label="Google Drive"]')).toBeNull();

    getButtonByText(root, 'Google Drive')?.click();
    await nextTick();
    expect(settings.value.googleDriveIntegrationEnabled).toBe(true);
    expect(googleDriveRow?.getAttribute('aria-checked')).toBe('true');

    getButtonByText(root, 'Google Drive')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    await nextTick();

    expect(settings.value.googleDriveIntegrationEnabled).toBeUndefined();
    expect(googleDriveRow?.getAttribute('aria-checked')).toBe('false');

    unmount();
  });

  it('shows Google Drive as disabled and off when no client id is available', async () => {
    googleDriveIntegrationAvailable = false;
    settings.value = {
      googleDriveIntegrationEnabled: true,
    };

    const { root, unmount } = await mountSettingsSections();
    const googleDriveButton = getButtonByText(root, 'Google Drive');
    const googleDriveRow = getCheckboxRow(root, 'Google Drive');
    const googleDriveStaticRow = getStaticRowByText(root, 'Google Drive');

    expect(root.textContent).toContain('Google Drive is not available in this build.');
    expect(googleDriveButton).toBeNull();
    expect(googleDriveRow).toBeNull();
    expect(googleDriveStaticRow?.tagName).toBe('DIV');

    googleDriveStaticRow?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(settings.value.googleDriveIntegrationEnabled).toBe(true);

    unmount();
  });

  it('renders disabled Error diagnostics as a disabled unchecked checkbox without a button row', async () => {
    const { root, unmount } = await mountSettingsSections();
    const errorDiagnosticsButton = getButtonByText(root, 'Error diagnostics');
    const errorDiagnosticsRow = getCheckboxRow(root, 'Error diagnostics');
    const errorDiagnosticsStaticRow = getStaticRowByText(root, 'Error diagnostics');

    expect(errorDiagnosticsButton).toBeNull();
    expect(errorDiagnosticsRow).toBeNull();
    expect(errorDiagnosticsStaticRow?.tagName).toBe('DIV');

    errorDiagnosticsStaticRow?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(settings.value).toEqual({});

    unmount();
  });

  it('toggles starter examples between hidden and default with row click and keyboard', async () => {
    const { root, unmount } = await mountSettingsSections();
    const starterExamplesRow = getCheckboxRow(root, 'Starter examples');

    expect(starterExamplesRow?.getAttribute('aria-checked')).toBe('true');
    expect(getVisualCheckbox(root, 'Starter examples')).not.toBeNull();

    getButtonByText(root, 'Starter examples')?.click();
    await nextTick();

    expect(settings.value.hideStarterWidget).toBe(true);
    expect(starterExamplesRow?.getAttribute('aria-checked')).toBe('false');

    getButtonByText(root, 'Starter examples')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    await nextTick();

    expect(settings.value.hideStarterWidget).toBeUndefined();
    expect(starterExamplesRow?.getAttribute('aria-checked')).toBe('true');

    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
