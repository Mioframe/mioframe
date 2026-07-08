import { readFileSync } from 'node:fs';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDStateLayer from './MDStateLayer.vue';

const mdStateLayerSource = readFileSync('src/shared/ui/State/MDStateLayer.vue', 'utf8');

describe('MDStateLayer', () => {
  it('uses system opacity tokens for hover, focus, and pressed states', () => {
    expect(mdStateLayerSource).toContain('--md-sys-state-hover-state-layer-opacity');
    expect(mdStateLayerSource).toContain('--md-sys-state-focus-state-layer-opacity');
    expect(mdStateLayerSource).toContain('--md-sys-state-pressed-state-layer-opacity');
    expect(mdStateLayerSource).toContain('--md-private-state-dragged-state-layer-opacity');
    expect(mdStateLayerSource).not.toContain('--md-state-hover-layer-opacity');
    expect(mdStateLayerSource).not.toContain('--md-state-focus-layer-opacity');
    expect(mdStateLayerSource).not.toContain('--md-state-pressed-layer-opacity');
    expect(mdStateLayerSource).not.toContain('--md-state-dragged-layer-opacity');
  });

  it('suppresses interactive state classes when disabled', () => {
    const wrapper = mount(MDStateLayer, {
      props: {
        hover: true,
        focused: true,
        pressed: true,
        dragged: true,
        disabled: true,
      },
    });

    expect(wrapper.classes()).toContain('md-state_disabled');
    expect(wrapper.classes()).not.toContain('md-state_hover');
    expect(wrapper.classes()).not.toContain('md-state_focused');
    expect(wrapper.classes()).not.toContain('md-state_pressed');
    expect(wrapper.classes()).not.toContain('md-state_dragged');
  });

  it('keeps dragged generic when enabled', () => {
    const wrapper = mount(MDStateLayer, {
      props: {
        dragged: true,
      },
    });

    expect(wrapper.classes()).toContain('md-state_dragged');
  });
});
