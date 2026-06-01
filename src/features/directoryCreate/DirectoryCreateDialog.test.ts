/* eslint-disable vue/one-component-per-file -- Focused dialog contract test with inline stubs. */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';

const createDirectoryMock = vi.fn();
const grantAccessMock = vi.fn();
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
const grantDisabledRef = ref(false);
const isGrantLoadingRef = ref(false);

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

vi.mock('@feature/deviceDirectoryAccessRecovery', () => ({
  useDeviceDirectoryAccessRecovery: () => ({
    grantAccess: grantAccessMock,
    grantDisabled: computed(() => grantDisabledRef.value),
    isGrantLoading: computed(() => isGrantLoadingRef.value),
    recoveryState: computed(() => recoveryStateRef.value),
    recoveryMessage: computed(() => recoveryMessageRef.value),
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
    grantAccessMock.mockReset();
    directoryStatRef.value = {
      capabilities: {
        canEditChildren: undefined,
      },
    };
    recoveryStateRef.value = undefined;
    recoveryMessageRef.value = 'Grant write access to edit this remembered space.';
    grantDisabledRef.value = false;
    isGrantLoadingRef.value = false;
  });

  it('attempts create when edit capability is unknown and then exposes write recovery', async () => {
    createDirectoryMock.mockRejectedValue(
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

    await wrapper.get('input').setValue('next-folder');
    const applyButton = wrapper.findAll('button').find((button) => button.text() === 'Create');

    if (!applyButton) {
      throw new Error('Expected Create button');
    }

    await applyButton.trigger('click');
    await flushPromises();

    expect(createDirectoryMock).toHaveBeenCalledWith('/Device Files/Work/next-folder');
    expect(wrapper.text()).toContain('Grant write access');
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
