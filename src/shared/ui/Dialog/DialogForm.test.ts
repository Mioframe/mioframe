import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import DialogForm from './DialogForm.vue';

vi.mock('../AriaHidden', () => ({ useModalAriaHidden: () => false }));
vi.mock('@shared/lib/onBackNavigation', () => ({ useOnBackNavigationStacked: vi.fn() }));
vi.mock('@shared/lib/useOnEscapeKeyStacked', () => ({ useOnEscapeKeyStacked: vi.fn() }));
vi.mock('@vueuse/integrations/useFocusTrap', () => ({
  useFocusTrap: () => ({ activate: vi.fn(), deactivate: vi.fn() }),
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
