import { readFileSync } from 'node:fs';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDStateLayer from './MDStateLayer.vue';

const mdStateLayerSource = readFileSync('src/shared/ui/State/MDStateLayer.vue', 'utf8');
const productionSharedUiFiles = [
  'src/shared/ui/Card/MDCard.vue',
  'src/shared/ui/Lists/listItemAnatomy.css',
  'src/shared/ui/Switch/MDSwitch.vue',
  'src/shared/ui/State/ripple.css',
];
const oldOpacityAliases = [
  '--md-state-hover-layer-opacity',
  '--md-state-focus-layer-opacity',
  '--md-state-pressed-layer-opacity',
  '--md-state-dragged-layer-opacity',
];

describe('MDStateLayer', () => {
  it('uses generic private opacity bridges with system token fallbacks', () => {
    expect(mdStateLayerSource).toContain('--md-private-state-hover-state-layer-opacity');
    expect(mdStateLayerSource).toContain('--md-private-state-focus-state-layer-opacity');
    expect(mdStateLayerSource).toContain('--md-private-state-pressed-state-layer-opacity');
    expect(mdStateLayerSource).toContain('--md-private-state-dragged-state-layer-opacity');
    expect(mdStateLayerSource).toContain('--md-sys-state-hover-state-layer-opacity');
    expect(mdStateLayerSource).toContain('--md-sys-state-focus-state-layer-opacity');
    expect(mdStateLayerSource).toContain('--md-sys-state-pressed-state-layer-opacity');
    expect(mdStateLayerSource).toContain('--md-sys-state-dragged-state-layer-opacity');
    for (const alias of oldOpacityAliases) {
      expect(mdStateLayerSource).not.toContain(alias);
    }
  });

  it('keeps old opacity aliases out of production shared UI bridges', () => {
    for (const file of productionSharedUiFiles) {
      const source = readFileSync(file, 'utf8');
      for (const alias of oldOpacityAliases) {
        expect(source, `${file} should not use ${alias}`).not.toContain(alias);
      }
    }
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
