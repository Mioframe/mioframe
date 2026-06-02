/* eslint-disable vue/one-component-per-file -- Focused dialog contract test with inline stubs. */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';

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
const requestFileSystemAccessMock = vi.fn();

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
    requestFileSystemAccessMock.mockReset();
    directoryStatRef.value = {
      capabilities: {
        canEditChildren: undefined,
      },
    };
  });

  it('drives full write recovery flow when edit capability is unknown', async () => {
    createDocumentMock
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

    await wrapper.get('input').setValue('New document');
    const applyButton = wrapper.findAll('button').find((b) => b.text() === 'Create');

    if (!applyButton) throw new Error('Expected Create button');

    await applyButton.trigger('click');
    await flushPromises();

    expect(createDocumentMock).toHaveBeenCalledTimes(1);

    const grantButton = wrapper.findAll('button').find((b) => b.text() === 'Grant write access');
    expect(grantButton).toBeDefined();

    if (!grantButton) throw new Error('Expected Grant write access button');

    await grantButton.trigger('click');
    await flushPromises();

    expect(requestFileSystemAccessMock).toHaveBeenCalledWith({
      operation: 'write',
      spaceName: 'Work',
    });

    expect(createDocumentMock).toHaveBeenCalledTimes(2);
    expect(wrapper.emitted('created')).toBeDefined();
  });

  it('shows denied message when browser denies write access', async () => {
    createDocumentMock.mockRejectedValueOnce(
      new WebFileSystemAccessRequiredError({
        mode: 'readwrite',
        spaceName: 'Work',
      }),
    );
    requestFileSystemAccessMock.mockResolvedValue({ status: 'denied' });

    const wrapper = await mountDialog();

    await wrapper.get('input').setValue('My document');
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
