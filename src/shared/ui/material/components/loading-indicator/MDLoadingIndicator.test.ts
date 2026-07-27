import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDLoadingIndicator from './MDLoadingIndicator.vue';

describe('MDLoadingIndicator adapter', () => {
  it('renders the canonical renderer element with the progressbar role and the accessible purpose label', () => {
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading news article' } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('aria-label')).toBe('Loading news article');
  });

  it('leaves the active indicator size unset by default so the renderer applies the Material default', () => {
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading' } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('style')).toBeUndefined();
  });

  it('maps an explicit size to the private renderer size input', () => {
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: '1.5rem' } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('style')).toContain('--m3e-loading-indicator-size: 1.5rem');
  });
});
