/* eslint-disable vue/one-component-per-file -- Focused shared status contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import type { VfsActivityState } from '@shared/lib/virtualFileSystem';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';

const vfsState = ref<VfsActivityState>({ status: 'idle', activeCount: 0 });
const dismissSaveStatusErrorMock = vi.fn();

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
    addSnackbar: vi.fn(),
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

const mountSaveStatusButton = async () => {
  const { default: SaveStatusButton } = await import('./SaveStatusButton.vue');

  return mount(SaveStatusButton);
};

describe('SaveStatusButton', () => {
  afterEach(() => {
    dismissSaveStatusErrorMock.mockReset();
    vfsState.value = { status: 'idle', activeCount: 0 };
  });

  it('stays hidden while idle', async () => {
    const wrapper = await mountSaveStatusButton();

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('shows active save details from the single status control', async () => {
    vfsState.value = { status: 'active', activeCount: 1 };

    const wrapper = await mountSaveStatusButton();

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

    const wrapper = await mountSaveStatusButton();

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

    const wrapper = await mountSaveStatusButton();

    expect(wrapper.text()).not.toContain('Could not confirm the last save.');
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after focused inline stubs. */
