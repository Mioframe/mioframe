/* eslint-disable vue/one-component-per-file -- Focused component contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { computed, defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import ImportZipProgressSheet from './ImportZipProgressSheet.vue';

vi.mock('@shared/lib/teleportContainer', () => ({
  TeleportContainer: defineComponent({
    name: 'TeleportContainerStub',
    setup(_props, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
}));

vi.mock('@shared/ui/Overlay', () => ({
  useOverlayContainer: () => computed(() => undefined),
}));

vi.mock('@shared/ui/AriaHidden', () => ({
  useModalAriaHidden: () => computed(() => false),
}));

vi.mock('@shared/ui/ProgressIndicators', () => ({
  MDCircularProgressIndicator: defineComponent({
    name: 'MDCircularProgressIndicatorStub',
    props: { progress: { type: Number, default: 0 } },
    setup(props) {
      return () => h('div', { 'data-progress': props.progress });
    },
  }),
}));

describe('ImportZipProgressSheet', () => {
  it('shows the validating phase label before any progress is reported', () => {
    const wrapper = mount(ImportZipProgressSheet);

    expect(wrapper.text()).toContain('Validating archive…');
  });

  it('shows the current phase label and count for unpacking progress', () => {
    const wrapper = mount(ImportZipProgressSheet, {
      props: { progress: { phase: 'unpacking', current: 3, total: 4 } },
    });

    expect(wrapper.text()).toContain('Writing files…');
    expect(wrapper.text()).toContain('3 / 4');
    expect(wrapper.find('[data-progress]').attributes('data-progress')).toBe('0.75');
  });

  it('shows the checking-conflicts phase label', () => {
    const wrapper = mount(ImportZipProgressSheet, {
      props: { progress: { phase: 'checkingConflicts' } },
    });

    expect(wrapper.text()).toContain('Checking for conflicts…');
  });

  it('renders as a non-dismissible modal status surface with no close affordance', () => {
    const wrapper = mount(ImportZipProgressSheet);

    expect(wrapper.find('[role="alertdialog"]').attributes('aria-modal')).toBe('true');
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.emitted()).toEqual({});
  });

  it('uses the shared Material type-scale classes for phase and count text', () => {
    const wrapper = mount(ImportZipProgressSheet, {
      props: { progress: { phase: 'unpacking', current: 1, total: 2 } },
    });

    expect(wrapper.find('.import-zip-progress-sheet__phase').classes()).toContain(
      'md-typescale-body-large',
    );
    expect(wrapper.find('.import-zip-progress-sheet__count').classes()).toContain(
      'md-typescale-body-medium',
    );
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
