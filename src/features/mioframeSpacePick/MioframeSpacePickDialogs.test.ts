import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { computed, defineComponent, h, ref } from 'vue';

const createFlowState = ref<
  | {
      status: 'idle';
    }
  | {
      status: 'editing-name' | 'existing-space-conflict';
      selectedLocation: string;
      resultFolder: string;
      spaceName?: string | undefined;
      errorText?: string | undefined;
    }
>({ status: 'idle' });

const loading = ref(false);
const updateCreateSpaceNameMock = vi.fn();
const submitCreateSpaceMock = vi.fn();
const cancelCreateSpaceMock = vi.fn();
const openExistingSpaceFromConflictMock = vi.fn();

vi.mock('./usePickMioframeSpace', () => ({
  usePickMioframeSpace: () => ({
    createFlowState: computed(() => createFlowState.value),
    loading,
    updateCreateSpaceName: updateCreateSpaceNameMock,
    submitCreateSpace: submitCreateSpaceMock,
    cancelCreateSpace: cancelCreateSpaceMock,
    openExistingSpaceFromConflict: openExistingSpaceFromConflictMock,
  }),
}));

vi.mock('./MioframeSpaceCreateDialog.vue', () => ({
  default: defineComponent({
    name: 'MioframeSpaceCreateDialogStub',
    props: {
      mode: {
        type: String,
        default: undefined,
      },
      modelValue: {
        type: String,
        default: undefined,
      },
      errorText: {
        type: String,
        default: undefined,
      },
      selectedLocation: {
        type: String,
        required: true,
      },
      resultFolder: {
        type: String,
        required: true,
      },
    },
    emits: ['update:model-value', 'apply', 'cancel'],
    setup(props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'mioframe-space-create-dialog' }, [
          h('span', { 'data-testid': 'mode' }, props.mode ?? ''),
          h('span', { 'data-testid': 'selected-location' }, props.selectedLocation),
          h('span', { 'data-testid': 'result-folder' }, props.resultFolder),
          h('span', { 'data-testid': 'model-value' }, props.modelValue ?? ''),
          h('span', { 'data-testid': 'error-text' }, props.errorText ?? ''),
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                emit('update:model-value', 'Renamed Space');
              },
            },
            'Rename',
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                emit('apply');
              },
            },
            'Apply',
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

const mountDialogs = async () => {
  const { default: MioframeSpacePickDialogs } = await import('./MioframeSpacePickDialogs.vue');
  return mount(MioframeSpacePickDialogs);
};

describe('MioframeSpacePickDialogs', () => {
  afterEach(() => {
    createFlowState.value = { status: 'idle' };
    loading.value = false;
    updateCreateSpaceNameMock.mockReset();
    submitCreateSpaceMock.mockReset();
    cancelCreateSpaceMock.mockReset();
    openExistingSpaceFromConflictMock.mockReset();
  });

  it('does not render placeholder DOM when no active dialog exists', async () => {
    const wrapper = await mountDialogs();

    expect(wrapper.html()).toBe('');
    expect(wrapper.find('[hidden]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="mioframe-space-create-dialog"]').exists()).toBe(false);
  });

  it('renders the active create dialog directly when mounted for an active flow', async () => {
    createFlowState.value = {
      status: 'editing-name',
      selectedLocation: 'Documents',
      resultFolder: 'Documents / <space name>',
      spaceName: undefined,
      errorText: undefined,
    };

    const wrapper = await mountDialogs();

    expect(wrapper.find('[data-testid="mioframe-space-create-dialog"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="mode"]').text()).toBe('create');
  });

  it('opens the existing space from conflict mode instead of submitting create', async () => {
    createFlowState.value = {
      status: 'existing-space-conflict',
      selectedLocation: 'Documents',
      resultFolder: 'Documents / Work Notes',
      spaceName: 'Work Notes',
      errorText: undefined,
    };

    const wrapper = await mountDialogs();

    const applyButton = wrapper.findAll('button')[1];

    if (!applyButton) {
      throw new Error('Expected apply button to exist');
    }

    await applyButton.trigger('click');

    expect(openExistingSpaceFromConflictMock).toHaveBeenCalledTimes(1);
    expect(submitCreateSpaceMock).not.toHaveBeenCalled();
  });
});
