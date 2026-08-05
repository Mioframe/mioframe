import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DialogForm from './DialogForm.vue';

const useFocusTrapMock = vi.fn((_target: unknown, _options?: { fallbackFocus: () => unknown }) => ({
  activate: vi.fn(),
  deactivate: vi.fn(),
}));

vi.mock('../AriaHidden', () => ({ useModalAriaHidden: () => false }));
vi.mock('@shared/lib/onBackNavigation', () => ({ useOnBackNavigationStacked: vi.fn() }));
vi.mock('@shared/lib/useOnEscapeKeyStacked', () => ({ useOnEscapeKeyStacked: vi.fn() }));
vi.mock('@vueuse/integrations/useFocusTrap', () => ({
  useFocusTrap: (target: unknown, options?: { fallbackFocus: () => unknown }) =>
    useFocusTrapMock(target, options),
}));
vi.mock('./Alert', () => ({ useMonitorOpenDialog: vi.fn() }));

const MDButtonStub = defineComponent({
  name: 'MDButton',
  props: {
    label: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    nativeType: { type: String, default: 'button' },
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          type: props.nativeType,
          disabled: props.disabled,
          onClick: (event: MouseEvent) => {
            emit('click', event);
          },
        },
        props.label,
      );
  },
});

const mountForm = (loading: boolean) =>
  mount(DialogForm, {
    props: {
      headline: 'Confirm',
      supportingText: 'Apply the change?',
      applyLabel: 'Apply',
      hasCancelAction: true,
      loading,
    },
    global: { stubs: { MDButton: MDButtonStub } },
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DialogForm focus trap', () => {
  it('gives the focus trap a fallback focus target that is always programmatically focusable', () => {
    const wrapper = mountForm(true);
    const form = wrapper.get('form');

    expect(form.attributes('tabindex')).toBe('-1');
    expect(useFocusTrapMock).toHaveBeenCalledTimes(1);

    const [, options] = useFocusTrapMock.mock.calls[0] ?? [];
    expect(options?.fallbackFocus()).toBe(form.element);
  });

  it('throws explicitly if the fallback resolver is invoked after the form is unavailable', () => {
    const wrapper = mountForm(true);
    const [, options] = useFocusTrapMock.mock.calls[0] ?? [];

    if (!options) throw new Error('Missing useFocusTrap options.');

    wrapper.unmount();

    expect(() => options.fallbackFocus()).toThrow(
      'DialogForm focus trap is active without its form container',
    );
  });
});

describe('DialogForm busy ownership', () => {
  it('marks the form busy, disables both actions, and blocks submit and cancel', async () => {
    const wrapper = mountForm(true);
    const form = wrapper.get('form');
    const buttons = wrapper.findAll('button');
    const cancelButton = buttons.at(0);

    if (!cancelButton) throw new Error('Missing DialogForm cancel button.');

    expect(form.attributes('aria-busy')).toBe('true');
    expect(buttons).toHaveLength(2);
    expect(buttons.every((button) => button.attributes('disabled') !== undefined)).toBe(true);

    await form.trigger('submit');
    await cancelButton.trigger('click');
    expect(wrapper.emitted('apply')).toBeUndefined();
    expect(wrapper.emitted('cancel')).toBeUndefined();
  });

  it('keeps normal apply and cancel actions available when idle', async () => {
    const wrapper = mountForm(false);
    const form = wrapper.get('form');
    const buttons = wrapper.findAll('button');
    const cancelButton = buttons.at(0);

    if (!cancelButton) throw new Error('Missing DialogForm cancel button.');

    expect(form.attributes('aria-busy')).toBeUndefined();
    await form.trigger('submit');
    await cancelButton.trigger('click');
    expect(wrapper.emitted('apply')).toHaveLength(1);
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });
});
