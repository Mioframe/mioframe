/* eslint-disable vue/one-component-per-file -- Focused dialog contract test with inline stubs. */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';

const createDirectoryMock = vi.fn();
const directoryStatRef = ref<{
  capabilities?: {
    canEditChildren: boolean | undefined;
  };
}>({
  capabilities: {
    canEditChildren: undefined,
  },
});
const getDeviceDirectoryAccessRequestMock = vi.fn();
const resolveDeviceDirectoryAccessRequestMock = vi.fn();
const cancelDeviceDirectoryAccessRequestMock = vi.fn();

vi.mock('@entity/fsEntry', () => ({
  useFSNodeStat: () => ({
    data: directoryStatRef,
  }),
}));

vi.mock('@entity/mountedDirectories', () => ({
  useFileSystem: () => ({
    createDirectory: createDirectoryMock,
  }),
}));

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      getDeviceDirectoryAccessRequest: getDeviceDirectoryAccessRequestMock,
      resolveDeviceDirectoryAccessRequest: resolveDeviceDirectoryAccessRequestMock,
      cancelDeviceDirectoryAccessRequest: cancelDeviceDirectoryAccessRequestMock,
    },
  }),
}));

vi.mock('@shared/ui/Dialog', () => ({
  MDDialog: defineComponent({
    name: 'MDDialogStub',
    props: {
      headline: { type: String, required: true },
      supportingText: { type: String, required: true },
      applyLabel: { type: String, required: true },
      loading: { type: Boolean, default: false },
    },
    emits: ['apply', 'cancel'],
    setup(props, { emit, slots }) {
      return () =>
        h('div', [
          h('h1', props.headline),
          h('p', props.supportingText),
          slots.default?.(),
          h(
            'button',
            {
              onClick: () => {
                emit('apply');
              },
            },
            props.applyLabel,
          ),
          h(
            'button',
            {
              onClick: () => {
                emit('cancel');
              },
            },
            'Cancel',
          ),
        ]);
    },
  }),
}));

vi.mock('@shared/ui/TextField', () => ({
  MDTextField: defineComponent({
    name: 'MDTextFieldStub',
    props: {
      modelValue: { type: String, default: undefined },
      supportingText: { type: String, default: undefined },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('div', [
          h('input', {
            value: props.modelValue,
            onInput: (event: Event) => {
              if (event.target instanceof HTMLInputElement) {
                emit('update:modelValue', event.target.value);
              }
            },
          }),
          props.supportingText ? h('span', props.supportingText) : null,
        ]);
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

const mountDialog = async () => {
  const { default: DirectoryCreateDialog } = await import('./DirectoryCreateDialog.vue');

  return mount(DirectoryCreateDialog, {
    props: {
      path: '/Device Files/Work',
    },
  });
};

describe('DirectoryCreateDialog', () => {
  beforeEach(() => {
    createDirectoryMock.mockReset();
    getDeviceDirectoryAccessRequestMock.mockReset();
    resolveDeviceDirectoryAccessRequestMock.mockReset();
    cancelDeviceDirectoryAccessRequestMock.mockReset();
    directoryStatRef.value = {
      capabilities: {
        canEditChildren: undefined,
      },
    };
  });

  it('drives full write recovery flow when edit capability is unknown', async () => {
    const requestPermissionMock = vi.fn(() => Promise.resolve<PermissionState>('granted'));
    createDirectoryMock
      .mockRejectedValueOnce(
        new WebFileSystemAccessRequiredError({
          mode: 'readwrite',
          spaceName: 'Work',
        }),
      )
      .mockResolvedValueOnce(undefined);
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      handle: { requestPermission: requestPermissionMock },
      mode: 'readwrite',
      spaceName: 'Work',
    });
    resolveDeviceDirectoryAccessRequestMock.mockResolvedValue({
      request: undefined,
      status: 'granted',
    });

    const wrapper = await mountDialog();

    expect(
      wrapper.find('button[disabled]').exists() || !wrapper.text().includes('Grant write access'),
    ).toBe(true);

    await wrapper.get('input').setValue('next-folder');
    const applyButton = wrapper.findAll('button').find((b) => b.text() === 'Create');

    if (!applyButton) throw new Error('Expected Create button');

    await applyButton.trigger('click');
    await flushPromises();

    expect(createDirectoryMock).toHaveBeenCalledWith('/Device Files/Work/next-folder');
    expect(getDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith({
      mode: 'readwrite',
      spaceName: 'Work',
    });

    await flushPromises();

    const grantButton = wrapper.findAll('button').find((b) => b.text() === 'Grant write access');
    expect(grantButton).toBeDefined();
    expect(grantButton?.attributes('disabled')).toBeUndefined();

    if (!grantButton) throw new Error('Expected Grant write access button');

    await grantButton.trigger('click');
    await flushPromises();

    expect(requestPermissionMock).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(resolveDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith({
      mode: 'readwrite',
      permissionState: 'granted',
      spaceName: 'Work',
    });

    expect(createDirectoryMock).toHaveBeenCalledTimes(2);
    expect(wrapper.emitted('created')).toBeDefined();
  });

  it('blocks immediately when edit capability is explicitly denied', async () => {
    directoryStatRef.value = {
      capabilities: {
        canEditChildren: false,
      },
    };

    const wrapper = await mountDialog();

    await wrapper.get('input').setValue('next-folder');
    const applyButton = wrapper.findAll('button').find((button) => button.text() === 'Create');

    if (!applyButton) {
      throw new Error('Expected Create button');
    }

    await applyButton.trigger('click');
    await flushPromises();

    expect(createDirectoryMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Creating entries is not allowed in this directory');
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
