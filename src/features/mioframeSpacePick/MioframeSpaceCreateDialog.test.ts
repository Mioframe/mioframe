/* eslint-disable vue/one-component-per-file -- This test file intentionally defines two small inline stubs. */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import MioframeSpaceCreateDialog from './MioframeSpaceCreateDialog.vue';
import type { CreateSpaceFieldIssue } from './useCreateMioframeSpace';

const {
  createSpaceMock,
  checkCreateSpaceNameAvailabilityMock,
  openExistingSpaceMock,
  isDiagnosticsPromptVisible,
  clearDiagnosticsPromptMock,
  isDiagnosticsErrorPromptEligible,
} = vi.hoisted(() => ({
  createSpaceMock: vi.fn(),
  checkCreateSpaceNameAvailabilityMock: vi.fn(),
  openExistingSpaceMock: vi.fn(),
  isDiagnosticsPromptVisible: { value: false },
  clearDiagnosticsPromptMock: vi.fn(),
  isDiagnosticsErrorPromptEligible: { value: true },
}));

const createDirectoryHandle = (name: string): FileSystemDirectoryHandle => ({
  kind: 'directory',
  name,
  isSameEntry: vi.fn(() => Promise.resolve(false)),
  requestPermission: vi.fn(() => Promise.resolve<'granted'>('granted')),
  queryPermission: vi.fn(() => Promise.resolve<'granted'>('granted')),
  isFile: false,
  isDirectory: true,
  entries: vi.fn(),
  keys: vi.fn(),
  values: vi.fn(),
  getDirectoryHandle: vi.fn(),
  getFileHandle: vi.fn(),
  removeEntry: vi.fn(),
  resolve: vi.fn(),
  getFile: vi.fn(),
  getDirectory: vi.fn(),
  getEntries: vi.fn(),
  [Symbol.asyncIterator]: vi.fn(),
});

vi.mock('@shared/ui/Dialog', () => ({
  MDDialog: defineComponent({
    name: 'MDDialogStub',
    props: {
      headline: {
        type: String,
        required: true,
      },
      supportingText: {
        type: String,
        default: undefined,
      },
      applyLabel: {
        type: String,
        required: true,
      },
      loading: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['apply', 'cancel'],
    setup(props, { emit, slots }) {
      return () =>
        h('section', [
          h('h1', props.headline),
          props.supportingText ? h('p', props.supportingText) : null,
          slots.default?.(),
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                emit('apply');
              },
            },
            props.applyLabel,
          ),
          h(
            'button',
            {
              type: 'button',
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
      modelValue: {
        type: String,
        default: undefined,
      },
      labelText: {
        type: String,
        required: true,
      },
      supportingText: {
        type: String,
        default: undefined,
      },
      error: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('label', [
          h('span', props.labelText),
          h('input', {
            value: props.modelValue,
            onInput: (event: Event) => {
              const input = event.target;

              if (!(input instanceof HTMLInputElement)) {
                return;
              }

              emit('update:modelValue', input.value);
            },
          }),
          props.supportingText ? h('span', props.supportingText) : null,
          props.error ? h('span', 'error') : null,
        ]);
    },
  }),
}));

vi.mock('@feature/diagnosticsErrorPrompt', () => ({
  useDiagnosticsErrorPromptEligibility: () => ({
    isDiagnosticsErrorPromptEligible,
  }),
  DiagnosticsErrorPrompt: defineComponent({
    name: 'DiagnosticsErrorPromptStub',
    props: { variant: { type: String, required: true } },
    setup() {
      return () => h('div', 'diagnostics-error-prompt-stub');
    },
  }),
}));

vi.mock('./useCreateMioframeSpace', async () => {
  const actual = await vi.importActual<typeof import('./useCreateMioframeSpace')>(
    './useCreateMioframeSpace',
  );

  return {
    ...actual,
    useCreateMioframeSpace: () => ({
      loading: false,
      isDiagnosticsPromptVisible: ref(isDiagnosticsPromptVisible.value),
      clearDiagnosticsPrompt: clearDiagnosticsPromptMock,
      checkCreateSpaceNameAvailability: checkCreateSpaceNameAvailabilityMock,
      createSpace: createSpaceMock,
      openExistingSpace: openExistingSpaceMock,
    }),
  };
});

const parentHandle = createDirectoryHandle('Documents');

const mountDialog = () =>
  mount(MioframeSpaceCreateDialog, {
    props: {
      parentHandle,
    },
  });

describe('MioframeSpaceCreateDialog', () => {
  beforeEach(() => {
    createSpaceMock.mockReset();
    checkCreateSpaceNameAvailabilityMock.mockReset();
    openExistingSpaceMock.mockReset();
    clearDiagnosticsPromptMock.mockReset();
    isDiagnosticsPromptVisible.value = false;
    isDiagnosticsErrorPromptEligible.value = true;
  });

  it('clears the local inline create-space prompt when the dialog unmounts', () => {
    const wrapper = mountDialog();

    expect(clearDiagnosticsPromptMock).not.toHaveBeenCalled();

    wrapper.unmount();

    expect(clearDiagnosticsPromptMock).toHaveBeenCalledTimes(1);
  });

  it('does not render the diagnostics prompt when it is not eligible', () => {
    const wrapper = mountDialog();

    expect(wrapper.text()).not.toContain('diagnostics-error-prompt-stub');
  });

  it('renders the contextual diagnostics prompt when eligible', () => {
    isDiagnosticsPromptVisible.value = true;
    const wrapper = mountDialog();

    expect(wrapper.text()).toContain('diagnostics-error-prompt-stub');
  });

  it('does not render the diagnostics prompt when the local flag is set but shared eligibility fails', () => {
    isDiagnosticsPromptVisible.value = true;
    isDiagnosticsErrorPromptEligible.value = false;
    const wrapper = mountDialog();

    expect(wrapper.text()).not.toContain('diagnostics-error-prompt-stub');
  });

  it('keeps invalid field issues locally and does not call availability or create actions', async () => {
    const wrapper = mountDialog();

    await wrapper.get('input').setValue('   ');
    await wrapper.get('button').trigger('click');

    expect(checkCreateSpaceNameAvailabilityMock).not.toHaveBeenCalled();
    expect(createSpaceMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Enter a space name.');
    expect(wrapper.emitted('completed')).toBeUndefined();
  });

  it('keeps ordinary-folder availability issues open and does not create', async () => {
    checkCreateSpaceNameAvailabilityMock.mockResolvedValueOnce({
      message: 'A folder with this name already exists. Choose another name.',
    });
    const wrapper = mountDialog();

    await wrapper.get('input').setValue('Work Notes');
    await wrapper.get('button').trigger('click');

    expect(checkCreateSpaceNameAvailabilityMock).toHaveBeenCalledWith('Work Notes');
    expect(createSpaceMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      'A folder with this name already exists. Choose another name.',
    );
    expect(wrapper.emitted('completed')).toBeUndefined();
  });

  it('switches to open-existing recovery and clears it when the field changes', async () => {
    const handle = createDirectoryHandle('Work Notes');
    checkCreateSpaceNameAvailabilityMock.mockResolvedValueOnce({
      message:
        'A Mioframe space with this name already exists here. Open the existing space, or choose another name.',
      existingSpace: {
        normalizedName: 'Work Notes',
        handle,
      },
    });
    openExistingSpaceMock.mockResolvedValueOnce(true);
    const wrapper = mountDialog();

    await wrapper.get('input').setValue('  Work Notes  ');
    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain('Space already exists');
    expect(wrapper.text()).toContain('Open existing space');

    await wrapper.get('button').trigger('click');

    expect(openExistingSpaceMock).toHaveBeenCalledWith(handle);
    expect(wrapper.emitted('completed')).toEqual([[]]);

    await wrapper.get('input').setValue('Work Notes 2');

    expect(wrapper.text()).toContain('Create');
    expect(wrapper.text()).not.toContain('Space already exists');
  });

  it('stays open without overwriting the current issue when availability handling already reported a failure', async () => {
    checkCreateSpaceNameAvailabilityMock.mockResolvedValueOnce({
      message: 'A folder with this name already exists. Choose another name.',
    });
    checkCreateSpaceNameAvailabilityMock.mockResolvedValueOnce(false);
    const wrapper = mountDialog();

    await wrapper.get('input').setValue('Work Notes');
    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain(
      'A folder with this name already exists. Choose another name.',
    );

    await wrapper.get('button').trigger('click');

    expect(createSpaceMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      'A folder with this name already exists. Choose another name.',
    );
    expect(wrapper.emitted('completed')).toBeUndefined();
  });

  it('creates with the parsed normalized name and closes only on success', async () => {
    checkCreateSpaceNameAvailabilityMock.mockResolvedValue(undefined);
    createSpaceMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const wrapper = mountDialog();

    await wrapper.get('input').setValue('  Work Notes  ');
    await wrapper.get('button').trigger('click');

    expect(checkCreateSpaceNameAvailabilityMock).toHaveBeenCalledWith('Work Notes');
    expect(createSpaceMock).toHaveBeenCalledWith('Work Notes');
    expect(wrapper.emitted('completed')).toBeUndefined();

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('completed')).toEqual([[]]);
  });

  it('keeps the dialog open and shows a create-time field issue without overwriting it on a later false result', async () => {
    const lateIssue: CreateSpaceFieldIssue = {
      message:
        'A Mioframe space with this name already exists here. Open the existing space, or choose another name.',
      existingSpace: {
        normalizedName: 'Work Notes',
        handle: createDirectoryHandle('Work Notes'),
      },
    };
    checkCreateSpaceNameAvailabilityMock.mockResolvedValue(undefined);
    createSpaceMock.mockResolvedValueOnce(lateIssue).mockResolvedValueOnce(false);
    const wrapper = mountDialog();

    await wrapper.get('input').setValue('Work Notes');
    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain('Space already exists');
    expect(wrapper.text()).toContain('Open existing space');
    expect(wrapper.emitted('completed')).toBeUndefined();

    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain('Open existing space');
    expect(wrapper.emitted('completed')).toBeUndefined();
  });

  it('keeps the existing-space issue visible when opening the conflicted space fails', async () => {
    const handle = createDirectoryHandle('Work Notes');
    checkCreateSpaceNameAvailabilityMock.mockResolvedValueOnce({
      message:
        'A Mioframe space with this name already exists here. Open the existing space, or choose another name.',
      existingSpace: {
        normalizedName: 'Work Notes',
        handle,
      },
    });
    openExistingSpaceMock.mockResolvedValueOnce(false);
    const wrapper = mountDialog();

    await wrapper.get('input').setValue('Work Notes');
    await wrapper.get('button').trigger('click');
    await wrapper.get('button').trigger('click');

    expect(openExistingSpaceMock).toHaveBeenCalledWith(handle);
    expect(wrapper.text()).toContain('Open existing space');
    expect(wrapper.emitted('completed')).toBeUndefined();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after the inline stubs used in this test file. */
