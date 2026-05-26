/* eslint-disable vue/one-component-per-file -- Focused shared status contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import type { VfsActivityState } from '@shared/lib/virtualFileSystem';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';

const vfsState = ref<VfsActivityState>({ status: 'idle', activeCount: 0 });
const dismissSaveStatusErrorMock = vi.fn();
const addSnackbarMock = vi.fn();
const writeClipboardMock = vi.fn();

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

describe('VfsActivityStatusChip', () => {
  afterEach(() => {
    dismissSaveStatusErrorMock.mockReset();
    addSnackbarMock.mockReset();
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
    vfsState.value = {
      status: 'error',
      activeCount: 0,
      lastError: {
        operationType: 'writeFile',
        path: '/private.txt',
        message: 'write failed',
        occurredAt: 1,
        acknowledged: false,
      },
    } as const;

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
    vfsState.value = {
      status: 'error',
      activeCount: 0,
      lastError: {
        operationType: 'writeFile',
        path: '/private.txt',
        message: 'write failed',
        occurredAt: 1,
        acknowledged: false,
      },
    } as const;

    const wrapper = await mountVfsActivityStatusChip();

    expect(wrapper.text()).not.toContain('Could not confirm the last save.');
  });

  it('shows a snackbar when clipboard support is unavailable', async () => {
    vfsState.value = {
      status: 'error',
      activeCount: 0,
      lastError: {
        operationType: 'writeFile',
        path: '/private.txt',
        message: 'write failed',
        occurredAt: 1,
        acknowledged: false,
      },
    } as const;
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    const wrapper = await mountVfsActivityStatusChip();

    await wrapper.get('button').trigger('click');
    await wrapper.findAll('button')[2]?.trigger('click');

    expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Clipboard is not available' });
  });

  it('copies details when clipboard writing succeeds', async () => {
    vfsState.value = {
      status: 'error',
      activeCount: 0,
      lastError: {
        operationType: 'writeFile',
        path: '/private.txt',
        message: 'write failed',
        occurredAt: 1,
        acknowledged: false,
      },
    } as const;
    writeClipboardMock.mockResolvedValue(undefined);

    const wrapper = await mountVfsActivityStatusChip();

    await wrapper.get('button').trigger('click');
    await wrapper.findAll('button')[2]?.trigger('click');

    expect(writeClipboardMock).toHaveBeenCalledOnce();
    const copiedText = writeClipboardMock.mock.calls[0]?.[0];
    expect(typeof copiedText).toBe('string');
    expect(copiedText).toContain('Could not save changes');
    expect(copiedText).toContain('Operation: write file');
    expect(copiedText).toContain('Details are hidden to protect private repository data.');
    expect(copiedText).not.toContain('/private.txt');
    expect(copiedText).not.toContain('write failed');
    expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Save error details copied' });
  });

  it('shows a snackbar when copying details fails', async () => {
    vfsState.value = {
      status: 'error',
      activeCount: 0,
      lastError: {
        operationType: 'writeFile',
        path: '/private.txt',
        message: 'write failed',
        occurredAt: 1,
        acknowledged: false,
      },
    } as const;
    writeClipboardMock.mockRejectedValue(new Error('copy failed'));

    const wrapper = await mountVfsActivityStatusChip();

    await wrapper.get('button').trigger('click');
    await wrapper.findAll('button')[2]?.trigger('click');

    expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Could not copy save error details' });
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after focused inline stubs. */
