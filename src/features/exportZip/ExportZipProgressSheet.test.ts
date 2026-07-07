/* eslint-disable vue/one-component-per-file -- Focused component contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { computed, defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import ExportZipProgressSheet from './ExportZipProgressSheet.vue';

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

describe('ExportZipProgressSheet', () => {
  it('shows the preparing phase label before any progress is reported', () => {
    const wrapper = mount(ExportZipProgressSheet);

    expect(wrapper.text()).toContain('Preparing export…');
  });

  it('shows the current phase label and count for reading progress', () => {
    const wrapper = mount(ExportZipProgressSheet, {
      props: { progress: { phase: 'reading', current: 2, total: 5 } },
    });

    expect(wrapper.text()).toContain('Reading files…');
    expect(wrapper.text()).toContain('2 / 5');
    expect(wrapper.find('[data-progress]').attributes('data-progress')).toBe('0.4');
  });

  it('shows the saving phase label', () => {
    const wrapper = mount(ExportZipProgressSheet, {
      props: { progress: { phase: 'saving' } },
    });

    expect(wrapper.text()).toContain('Saving archive…');
  });

  it('renders as a non-dismissible modal status surface with no close affordance', () => {
    const wrapper = mount(ExportZipProgressSheet);

    expect(wrapper.find('[role="alertdialog"]').attributes('aria-modal')).toBe('true');
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.emitted()).toEqual({});
  });

  it('uses the shared Material type-scale classes for phase and count text', () => {
    const wrapper = mount(ExportZipProgressSheet, {
      props: { progress: { phase: 'reading', current: 1, total: 2 } },
    });

    expect(wrapper.find('.export-zip-progress-sheet__phase').classes()).toContain(
      'md-typescale-body-large',
    );
    expect(wrapper.find('.export-zip-progress-sheet__count').classes()).toContain(
      'md-typescale-body-medium',
    );
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
