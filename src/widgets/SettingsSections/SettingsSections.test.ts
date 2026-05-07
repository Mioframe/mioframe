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
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          props.is,
          {
            type: typeof props.type === 'string' ? props.type : undefined,
            onClick:
              props.is === 'button'
                ? () => {
                    emit('click');
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
      ariaLabel: {
        type: String,
        required: true,
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
        h('input', {
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
  onOpenPrivacyHelp,
}: {
  onOpenPrivacyHelp?: (() => void) | undefined;
} = {}) => {
  const { SettingsSections } = await import('./index');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(SettingsSections, {
    onOpenPrivacyHelp,
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

const getCheckbox = (root: HTMLElement, label: string) =>
  root.querySelector<HTMLInputElement>(`input[type="checkbox"][aria-label="${label}"]`);

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
    const onOpenPrivacyHelp = vi.fn();
    const { root, unmount } = await mountSettingsSections({ onOpenPrivacyHelp });

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

    expect(onOpenPrivacyHelp).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('toggles Google Drive between true and undefined with row click and keyboard', async () => {
    const { root, unmount } = await mountSettingsSections();

    getButtonByText(root, 'Google Drive')?.click();
    await nextTick();
    expect(settings.value.googleDriveIntegrationEnabled).toBe(true);

    const checkbox = getCheckbox(root, 'Google Drive');
    checkbox?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await nextTick();

    expect(settings.value.googleDriveIntegrationEnabled).toBeUndefined();

    unmount();
  });

  it('shows Google Drive as disabled and off when no client id is available', async () => {
    googleDriveIntegrationAvailable = false;
    settings.value = {
      googleDriveIntegrationEnabled: true,
    };

    const { root, unmount } = await mountSettingsSections();
    const checkbox = getCheckbox(root, 'Google Drive');
    const googleDriveButton = getButtonByText(root, 'Google Drive');

    expect(root.textContent).toContain('Google Drive is not available in this build.');
    expect(checkbox?.checked).toBe(false);
    expect(checkbox?.disabled).toBe(true);
    expect(googleDriveButton).toBeNull();

    getStaticRowByText(root, 'Google Drive')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await nextTick();

    expect(settings.value.googleDriveIntegrationEnabled).toBe(true);

    unmount();
  });

  it('renders disabled Error diagnostics as a disabled unchecked checkbox without a button row', async () => {
    const { root, unmount } = await mountSettingsSections();
    const checkbox = getCheckbox(root, 'Error diagnostics');
    const errorDiagnosticsButton = getButtonByText(root, 'Error diagnostics');

    expect(checkbox?.checked).toBe(false);
    expect(checkbox?.disabled).toBe(true);
    expect(errorDiagnosticsButton).toBeNull();

    getStaticRowByText(root, 'Error diagnostics')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await nextTick();

    expect(settings.value).toEqual({});

    unmount();
  });

  it('toggles starter examples between hidden and default with row click and keyboard', async () => {
    const { root, unmount } = await mountSettingsSections();
    const checkbox = getCheckbox(root, 'Starter examples');

    expect(checkbox?.checked).toBe(true);

    getButtonByText(root, 'Starter examples')?.click();
    await nextTick();

    expect(settings.value.hideStarterWidget).toBe(true);

    checkbox?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await nextTick();

    expect(settings.value.hideStarterWidget).toBeUndefined();

    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
