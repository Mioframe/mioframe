/* eslint-disable vue/one-component-per-file -- Focused shared status contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import type { VfsActivityState } from '@shared/lib/virtualFileSystem';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';

const vfsState = ref<VfsActivityState>({ status: 'idle', activeCount: 0 });
const dismissSaveStatusErrorMock = vi.fn();
const addSnackbarMock = vi.fn();
const writeClipboardMock = vi.fn();
const requestAccessMock = vi.fn();

vi.mock('@entity/vfsActivity', () => ({
  useVfsActivity: () => ({
    state: computed(() => vfsState.value),
    hasUnacknowledgedError: computed(
      () => vfsState.value.status === 'error' && vfsState.value.lastError?.acknowledged !== true,
    ),
  }),
}));

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      acknowledgeVfsActivityError: dismissSaveStatusErrorMock,
    },
  }),
}));

vi.mock('@shared/service/fileSystemClient', () => ({
  useFileSystemAccessPermissionBroker: () => ({
    requestAccess: requestAccessMock,
  }),
}));

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: addSnackbarMock,
  }),
}));

vi.mock('@shared/ui/Chips', () => ({
  MDAssistChip: defineComponent({
    name: 'MDAssistChipStub',
    props: { label: { type: String, required: true } },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            onClick: () => {
              emit('click');
            },
          },
          [slots.leadingIcon?.(), props.label],
        );
    },
  }),
}));

vi.mock('@shared/ui/Button', () => ({
  MDButton: defineComponent({
    name: 'MDButtonStub',
    props: {
      label: { type: String, required: true },
      disabled: { type: Boolean, default: false },
    },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            disabled: props.disabled,
            onClick: () => {
              emit('click');
            },
          },
          props.label,
        );
    },
  }),
}));

vi.mock('@shared/ui/Icon', () => ({
  MDSymbol: defineComponent({
    name: 'MDSymbolStub',
    setup() {
      return () => h('span', 'icon');
    },
  }),
}));

vi.mock('@shared/ui/Tooltips', () => ({
  MDOverlayTooltip: defineComponent({
    name: 'MDOverlayTooltipStub',
    props: {
      show: { type: Boolean, required: true },
      targetElement: {
        type: null,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      return () => (props.show ? h('div', slots.default?.()) : null);
    },
  }),
}));

const mountVfsActivityStatusChip = async () => {
  const { default: VfsActivityStatusChip } = await import('./VfsActivityStatusChip.vue');

  return mount(VfsActivityStatusChip);
};

const createErrorState = (
  lastError: NonNullable<VfsActivityState['lastError']>,
): VfsActivityState => ({
  status: 'error',
  activeCount: 0,
  lastError,
});

const createWriteError = (overrides?: {
  cause?: unknown;
}): NonNullable<VfsActivityState['lastError']> => ({
  operationType: 'writeFile',
  path: '/private.txt',
  message: 'write failed',
  occurredAt: 1,
  acknowledged: false,
  ...(overrides?.cause !== undefined ? { cause: overrides.cause } : {}),
});

const clickButtonByLabel = async (
  wrapper: Awaited<ReturnType<typeof mountVfsActivityStatusChip>>,
  label: string,
) => {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === label)
    ?.trigger('click');
};

describe('VfsActivityStatusChip', () => {
  afterEach(() => {
    dismissSaveStatusErrorMock.mockReset();
    addSnackbarMock.mockReset();
    requestAccessMock.mockReset();
    writeClipboardMock.mockReset();
    vfsState.value = { status: 'idle', activeCount: 0 };
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeClipboardMock },
    });
  });

  it('stays hidden while idle', async () => {
    const wrapper = await mountVfsActivityStatusChip();

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('shows active save details from the single status control', async () => {
    vfsState.value = { status: 'active', activeCount: 1 };

    const wrapper = await mountVfsActivityStatusChip();

    expect(wrapper.text()).not.toContain('Changes are still being saved.');

    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain('Saving…');
    expect(wrapper.text()).toContain('Changes are still being saved.');
    expect(wrapper.text()).not.toContain('Copy details');

    const buttons = wrapper.findAll('button');
    await buttons.at(-1)?.trigger('click');

    expect(wrapper.text()).not.toContain('Changes are still being saved.');
  });

  it('shows error details and keeps the copy action reachable', async () => {
    vfsState.value = createErrorState(createWriteError());

    const wrapper = await mountVfsActivityStatusChip();

    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain('Could not save changes');
    expect(wrapper.text()).toContain('Could not confirm the last save.');
    expect(wrapper.text()).toContain('Copy details');

    const buttons = wrapper.findAll('button');
    await buttons[1]?.trigger('click');

    expect(dismissSaveStatusErrorMock).toHaveBeenCalled();
  });

  it('keeps error details hidden until the status control is opened', async () => {
    vfsState.value = createErrorState(createWriteError());

    const wrapper = await mountVfsActivityStatusChip();

    expect(wrapper.text()).not.toContain('Could not confirm the last save.');
  });

  it('shows a snackbar when clipboard support is unavailable', async () => {
    vfsState.value = createErrorState(createWriteError());
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    const wrapper = await mountVfsActivityStatusChip();

    await wrapper.get('button').trigger('click');
    await clickButtonByLabel(wrapper, 'Copy details');

    expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Clipboard is not available' });
  });

  it('copies details when clipboard writing succeeds', async () => {
    const transferredCause = new WebFileSystemAccessRequiredError({
      mode: 'readwrite',
      spaceName: 'Work',
    });
    vfsState.value = createErrorState(createWriteError({ cause: transferredCause }));
    writeClipboardMock.mockResolvedValue(undefined);

    const wrapper = await mountVfsActivityStatusChip();

    await wrapper.get('button').trigger('click');
    await clickButtonByLabel(wrapper, 'Copy details');

    expect(writeClipboardMock).toHaveBeenCalledOnce();
    const copiedText = writeClipboardMock.mock.calls[0]?.[0];
    expect(typeof copiedText).toBe('string');
    expect(copiedText).toContain('Could not save changes');
    expect(copiedText).toContain('Operation: write file');
    expect(copiedText).toContain('Details are hidden to protect private repository data.');
    expect(copiedText).not.toContain('/private.txt');
    expect(copiedText).not.toContain('write failed');
    expect(copiedText).not.toContain('remembered local space');
    expect(copiedText).not.toContain('Work');
    expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Save error details copied' });
  });

  it('shows a snackbar when copying details fails', async () => {
    vfsState.value = createErrorState(createWriteError());
    writeClipboardMock.mockRejectedValue(new Error('copy failed'));

    const wrapper = await mountVfsActivityStatusChip();

    await wrapper.get('button').trigger('click');
    await clickButtonByLabel(wrapper, 'Copy details');

    expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Could not copy save error details' });
  });

  it('shows grant write access for recoverable transferred write errors', async () => {
    vfsState.value = createErrorState(
      createWriteError({
        cause: new WebFileSystemAccessRequiredError({
          mode: 'readwrite',
          spaceName: 'Work',
        }),
      }),
    );

    const wrapper = await mountVfsActivityStatusChip();

    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain('Grant write access');
    expect(wrapper.text()).toContain(
      'Browser write access is required to save changes in this remembered local space.',
    );
    expect(requestAccessMock).not.toHaveBeenCalled();
  });

  it('does not show grant write access for generic save errors', async () => {
    vfsState.value = createErrorState(createWriteError());

    const wrapper = await mountVfsActivityStatusChip();

    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).not.toContain('Grant write access');
  });

  it('does not show grant write access for read recovery causes', async () => {
    vfsState.value = createErrorState(
      createWriteError({
        cause: new WebFileSystemAccessRequiredError({
          mode: 'read',
          spaceName: 'Work',
        }),
      }),
    );

    const wrapper = await mountVfsActivityStatusChip();

    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).not.toContain('Grant write access');
  });

  it('requests write access through the one-shot broker and dismisses on granted', async () => {
    requestAccessMock.mockResolvedValue({ status: 'granted' });
    vfsState.value = createErrorState(
      createWriteError({
        cause: new WebFileSystemAccessRequiredError({
          mode: 'readwrite',
          spaceName: 'Work',
        }),
      }),
    );

    const wrapper = await mountVfsActivityStatusChip();

    await wrapper.get('button').trigger('click');
    await clickButtonByLabel(wrapper, 'Grant write access');

    expect(requestAccessMock).toHaveBeenCalledWith({
      operation: 'write',
      spaceName: 'Work',
    });
    expect(dismissSaveStatusErrorMock).toHaveBeenCalledOnce();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Write access granted. Future saves can continue.',
    });
  });

  it.each([
    ['denied', 'Browser write access was not granted. Saving remains blocked.'],
    ['cancelled', 'Browser write access was not granted. Saving remains blocked.'],
    ['error', 'Could not request browser write access. Try again from this action.'],
  ] as const)(
    'keeps the error visible and shows a safe message when access result is %s',
    async (status, message) => {
      requestAccessMock.mockResolvedValue({ status });
      vfsState.value = createErrorState(
        createWriteError({
          cause: new WebFileSystemAccessRequiredError({
            mode: 'readwrite',
            spaceName: 'Work',
          }),
        }),
      );

      const wrapper = await mountVfsActivityStatusChip();

      await wrapper.get('button').trigger('click');
      await clickButtonByLabel(wrapper, 'Grant write access');

      expect(dismissSaveStatusErrorMock).not.toHaveBeenCalled();
      expect(addSnackbarMock).toHaveBeenCalledWith({ text: message });
      expect(wrapper.text()).toContain('Grant write access');
    },
  );
});
/* eslint-enable vue/one-component-per-file -- Re-enable after focused inline stubs. */
