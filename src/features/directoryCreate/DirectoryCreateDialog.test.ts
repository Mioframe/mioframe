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
const requestFileSystemAccessMock = vi.fn();

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
      requestFileSystemAccess: requestFileSystemAccessMock,
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
    requestFileSystemAccessMock.mockReset();
    directoryStatRef.value = {
      capabilities: {
        canEditChildren: undefined,
      },
    };
  });

  it('drives full write recovery flow when edit capability is unknown', async () => {
    createDirectoryMock
      .mockRejectedValueOnce(
        new WebFileSystemAccessRequiredError({
          mode: 'readwrite',
          spaceName: 'Work',
        }),
      )
      .mockResolvedValueOnce(undefined);
    requestFileSystemAccessMock.mockResolvedValue({ status: 'granted' });

    const wrapper = await mountDialog();

    expect(wrapper.text()).not.toContain('Grant write access');

    await wrapper.get('input').setValue('next-folder');
    const applyButton = wrapper.findAll('button').find((b) => b.text() === 'Create');

    if (!applyButton) throw new Error('Expected Create button');

    await applyButton.trigger('click');
    await flushPromises();

    expect(createDirectoryMock).toHaveBeenCalledWith('/Device Files/Work/next-folder');

    const grantButton = wrapper.findAll('button').find((b) => b.text() === 'Grant write access');
    expect(grantButton).toBeDefined();

    if (!grantButton) throw new Error('Expected Grant write access button');

    await grantButton.trigger('click');
    await flushPromises();

    expect(requestFileSystemAccessMock).toHaveBeenCalledWith({
      operation: 'write',
      spaceName: 'Work',
    });

    expect(createDirectoryMock).toHaveBeenCalledTimes(2);
    expect(wrapper.emitted('created')).toBeDefined();
  });

  it('shows denied message when browser denies write access', async () => {
    createDirectoryMock.mockRejectedValueOnce(
      new WebFileSystemAccessRequiredError({
        mode: 'readwrite',
        spaceName: 'Work',
      }),
    );
    requestFileSystemAccessMock.mockResolvedValue({ status: 'denied' });

    const wrapper = await mountDialog();

    await wrapper.get('input').setValue('next-folder');
    const applyButton = wrapper.findAll('button').find((b) => b.text() === 'Create');
    if (!applyButton) throw new Error('Expected Create button');

    await applyButton.trigger('click');
    await flushPromises();

    const grantButton = wrapper.findAll('button').find((b) => b.text() === 'Grant write access');
    if (!grantButton) throw new Error('Expected Grant write access button');

    await grantButton.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain(
      'Editing is not allowed in this remembered space because your browser denied write access.',
    );
    expect(createDirectoryMock).toHaveBeenCalledTimes(1);
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
