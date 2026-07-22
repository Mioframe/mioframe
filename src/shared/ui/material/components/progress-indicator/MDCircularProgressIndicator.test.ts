import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDCircularProgressIndicator from './MDCircularProgressIndicator.vue';

describe('MDCircularProgressIndicator', () => {
  it('is indeterminate and decorative by default', () => {
    const wrapper = mount(MDCircularProgressIndicator);
    const svg = wrapper.get('svg');

    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(svg.attributes('role')).toBeUndefined();
    expect(svg.find('animatetransform').exists()).toBe(true);
    expect(svg.get('.md-circular-progress-indicator__progress').find('animate').exists()).toBe(
      true,
    );
  });

  it('treats progress=0 as an active determinate state, distinct from indeterminate', () => {
    const wrapper = mount(MDCircularProgressIndicator, { props: { progress: 0 } });
    const svg = wrapper.get('svg');

    expect(svg.find('animatetransform').exists()).toBe(false);
    expect(svg.find('.md-circular-progress-indicator__progress').exists()).toBe(false);
    expect(svg.find('.md-circular-progress-indicator__track').exists()).toBe(true);
  });

  it('renders a static determinate arc for a positive progress value', () => {
    const wrapper = mount(MDCircularProgressIndicator, { props: { progress: 0.5 } });
    const svg = wrapper.get('svg');
    const activeIndicator = svg.get('.md-circular-progress-indicator__progress');

    expect(activeIndicator.find('animate').exists()).toBe(false);
    expect(svg.find('animatetransform').exists()).toBe(false);
  });

  it('exposes no accessible name by default, and a full progressbar contract when labeled', () => {
    const unlabeled = mount(MDCircularProgressIndicator, { props: { progress: 0.25 } });
    expect(unlabeled.get('svg').attributes('aria-label')).toBeUndefined();

    const labeled = mount(MDCircularProgressIndicator, {
      props: { progress: 0.25, label: 'Uploading' },
    });
    const svg = labeled.get('svg');

    expect(svg.attributes('role')).toBe('progressbar');
    expect(svg.attributes('aria-hidden')).toBeUndefined();
    expect(svg.attributes('aria-label')).toBe('Uploading');
    expect(svg.attributes('aria-valuemin')).toBe('0');
    expect(svg.attributes('aria-valuemax')).toBe('100');
    expect(svg.attributes('aria-valuenow')).toBe('25');
  });

  it('omits aria-valuenow while indeterminate even when labeled', () => {
    const wrapper = mount(MDCircularProgressIndicator, { props: { label: 'Loading' } });

    expect(wrapper.get('svg').attributes('aria-valuenow')).toBeUndefined();
  });

  it('renders the requested size as the svg width and height', () => {
    const wrapper = mount(MDCircularProgressIndicator, { props: { size: 24 } });
    const svg = wrapper.get('svg');

    expect(svg.attributes('width')).toBe('24');
    expect(svg.attributes('height')).toBe('24');
  });
});
