/* eslint-disable vue/one-component-per-file -- Focused dialog contract test with inline stubs. */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
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
const recoveryStateRef = ref<{ mode: 'readwrite'; spaceName: string } | undefined>();
const recoveryMessageRef = ref('Grant write access to edit this remembered space.');

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

vi.mock('@feature/deviceDirectoryAccessRecovery', () => ({
  useDeviceDirectoryAccessRecovery: () => ({
    grantAccess: vi.fn(),
    grantDisabled: computed(() => false),
    isGrantLoading: computed(() => false),
    recoveryState: computed(() => recoveryStateRef.value),
    recoveryMessage: computed(() => recoveryMessageRef.value),
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
    },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
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
    directoryStatRef.value = {
      capabilities: {
        canEditChildren: undefined,
      },
    };
    recoveryStateRef.value = undefined;
    recoveryMessageRef.value = 'Grant write access to edit this remembered space.';
  });

  it('attempts create when edit capability is unknown and then exposes write recovery', async () => {
    createDocumentMock.mockRejectedValue(
      new WebFileSystemAccessRequiredError({
        mode: 'readwrite',
        spaceName: 'Work',
      }),
    );
    recoveryStateRef.value = {
      mode: 'readwrite',
      spaceName: 'Work',
    };

    const wrapper = await mountDialog();

    await wrapper.get('input').setValue('New document');
    const applyButton = wrapper.findAll('button').find((button) => button.text() === 'Create');

    if (!applyButton) {
      throw new Error('Expected Create button');
    }

    await applyButton.trigger('click');
    await flushPromises();

    expect(createDocumentMock).toHaveBeenCalled();
    expect(wrapper.text()).toContain('Grant write access');
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
