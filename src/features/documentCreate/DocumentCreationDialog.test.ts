/* eslint-disable vue/one-component-per-file -- Focused dialog contract test with inline stubs. */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

const createDocumentMock = vi.fn();
const directoryStatRef = ref<{
  capabilities?: {
    canEditChildren: boolean | undefined;
  };
}>({
  capabilities: {
    canEditChildren: undefined,
  },
});
const clearPreparedRequestMock = vi.fn();
const prepareAccessRequestMock = vi.fn();
const requestPreparedAccessMock = vi.fn();
const confirmMock = vi.fn();

const createSerializedRecoveryError = ({
  mode,
  spaceName,
}: {
  mode: 'read' | 'readwrite';
  spaceName: string;
}) =>
  Object.assign(new Error('Permission required to open this remembered local space'), {
    code: 'web-file-system-access-required',
    mode,
    name: 'WebFileSystemAccessRequiredError',
    spaceName,
  });

vi.mock('@entity/fsEntry', () => ({
  useFSNodeStat: () => ({
    data: directoryStatRef,
  }),
}));

vi.mock('@entity/repository', () => ({
  useRepository: () => ({
    createDocument: createDocumentMock,
  }),
}));

vi.mock('@shared/service/fileSystem', () => ({
  useFileSystemAccessPermissionBroker: () => ({
    clearPreparedRequest: clearPreparedRequestMock,
    prepareAccessRequest: prepareAccessRequestMock,
    requestPreparedAccess: requestPreparedAccessMock,
  }),
}));

vi.mock('@shared/ui/Dialog', () => ({
  MDDialog: defineComponent({
    name: 'MDDialogStub',
    props: {
      headline: { type: String, required: true },
      applyLabel: { type: String, required: true },
    },
    emits: ['apply'],
    setup(props, { emit, slots }) {
      return () =>
        h('div', [
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
        ]);
    },
  }),
  useDialog: () => ({
    confirm: confirmMock,
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

vi.mock('@shared/ui/Select', () => ({
  MDSelectBase: defineComponent({
    name: 'MDSelectBaseStub',
    setup(_props, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
  MDSelectOption: defineComponent({
    name: 'MDSelectOptionStub',
    setup() {
      return () => null;
    },
  }),
}));

const mountDialog = async () => {
  const { default: DocumentCreationDialog } = await import('./DocumentCreationDialog.vue');

  return mount(DocumentCreationDialog, {
    props: {
      path: '/Device Files/Work',
    },
  });
};

describe('DocumentCreationDialog', () => {
  beforeEach(() => {
    createDocumentMock.mockReset();
    clearPreparedRequestMock.mockReset();
    prepareAccessRequestMock.mockReset();
    requestPreparedAccessMock.mockReset();
    confirmMock.mockReset();
    directoryStatRef.value = {
      capabilities: {
        canEditChildren: undefined,
      },
    };
  });

  it('opens a separate permission dialog and retries create after grant', async () => {
    createDocumentMock
      .mockRejectedValueOnce(
        createSerializedRecoveryError({
          mode: 'readwrite',
          spaceName: 'Work',
        }),
      )
      .mockResolvedValueOnce(undefined);
    prepareAccessRequestMock.mockResolvedValue({
      operation: 'write',
      spaceName: 'Work',
    });
    confirmMock.mockResolvedValue(true);
    requestPreparedAccessMock.mockResolvedValue({ status: 'granted' });

    const wrapper = await mountDialog();

    expect(wrapper.text()).not.toContain('Grant write access');

    await wrapper.get('input').setValue('New document');
    const applyButton = wrapper.findAll('button').find((b) => b.text() === 'Create');

    if (!applyButton) throw new Error('Expected Create button');

    await applyButton.trigger('click');
    await flushPromises();

    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'Grant write access',
      supportingText:
        'Mioframe remembers "Work", but your browser requires write access before creating a document in it.',
      confirmLabel: 'Grant access',
      cancelLabel: 'Not now',
    });
    expect(requestPreparedAccessMock).toHaveBeenCalledWith({
      operation: 'write',
      spaceName: 'Work',
    });
    expect(createDocumentMock).toHaveBeenCalledTimes(2);
    expect(wrapper.emitted('created')).toBeDefined();
  });

  it('shows denied message and does not retry when browser denies write access', async () => {
    createDocumentMock.mockRejectedValueOnce(
      createSerializedRecoveryError({
        mode: 'readwrite',
        spaceName: 'Work',
      }),
    );
    prepareAccessRequestMock.mockResolvedValue({
      operation: 'write',
      spaceName: 'Work',
    });
    confirmMock.mockResolvedValue(true);
    requestPreparedAccessMock.mockResolvedValue({ status: 'denied' });

    const wrapper = await mountDialog();

    await wrapper.get('input').setValue('My document');
    const applyButton = wrapper.findAll('button').find((b) => b.text() === 'Create');
    if (!applyButton) throw new Error('Expected Create button');

    await applyButton.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain(
      'Creating entries is not allowed in this remembered space because your browser denied write access.',
    );
    expect(createDocumentMock).toHaveBeenCalledTimes(1);
  });

  it('shows a safe message and does not retry when the user declines the grant dialog', async () => {
    createDocumentMock.mockRejectedValueOnce(
      createSerializedRecoveryError({
        mode: 'readwrite',
        spaceName: 'Work',
      }),
    );
    prepareAccessRequestMock.mockResolvedValue({
      operation: 'write',
      spaceName: 'Work',
    });
    confirmMock.mockResolvedValue(false);

    const wrapper = await mountDialog();

    await wrapper.get('input').setValue('My document');
    const applyButton = wrapper.findAll('button').find((b) => b.text() === 'Create');
    if (!applyButton) throw new Error('Expected Create button');

    await applyButton.trigger('click');
    await flushPromises();

    expect(clearPreparedRequestMock).toHaveBeenCalledWith({
      operation: 'write',
      spaceName: 'Work',
    });
    expect(wrapper.text()).toContain(
      'Grant write access to create entries in this remembered space.',
    );
    expect(createDocumentMock).toHaveBeenCalledTimes(1);
  });

  it('blocks create before write when edit capability is explicitly denied', async () => {
    directoryStatRef.value = {
      capabilities: {
        canEditChildren: false,
      },
    };

    const wrapper = await mountDialog();

    await wrapper.get('input').setValue('My document');
    const applyButton = wrapper.findAll('button').find((b) => b.text() === 'Create');

    if (!applyButton) throw new Error('Expected Create button');

    await applyButton.trigger('click');
    await flushPromises();

    expect(createDocumentMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Creating entries is not allowed in this directory');
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
