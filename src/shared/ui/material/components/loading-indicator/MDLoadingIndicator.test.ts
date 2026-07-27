import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MDLoadingIndicator from './MDLoadingIndicator.vue';

describe('MDLoadingIndicator adapter', () => {
  it('renders the canonical renderer element with the progressbar role and the accessible purpose label', () => {
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading news article' } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('aria-label')).toBe('Loading news article');
  });

  it('applies the official default size of 48 when no size is supplied', () => {
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading' } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('style')).toContain('--m3e-loading-indicator-size: 48px');
  });

  it('maps an explicit valid size to the private renderer size input', () => {
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: 32 } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('style')).toContain('--m3e-loading-indicator-size: 32px');
  });

  it('clamps a size below the accepted 24-240 range to the lower bound and warns in development', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: 8 } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('style')).toContain('--m3e-loading-indicator-size: 24px');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('must be between 24 and 240'));

    warnSpy.mockRestore();
  });

  it('clamps a size above the accepted 24-240 range to the upper bound and warns in development', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: 480 } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('style')).toContain('--m3e-loading-indicator-size: 240px');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('must be between 24 and 240'));

    warnSpy.mockRestore();
  });

  it('normalizes a NaN size to the default 48 and warns in development', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: NaN } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('style')).toBe('--m3e-loading-indicator-size: 48px;');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('must be a finite number'));

    warnSpy.mockRestore();
  });

  it('normalizes an infinite size to the default 48 and warns in development', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: Infinity } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('style')).toBe('--m3e-loading-indicator-size: 48px;');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('must be a finite number'));

    warnSpy.mockRestore();
  });

  it('normalizes a negative-infinite size to the default 48 and warns in development', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: -Infinity } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('style')).toBe('--m3e-loading-indicator-size: 48px;');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('must be a finite number'));

    warnSpy.mockRestore();
  });

  it('maps the normalized size to the confirmed effective m3e 2.6.2 CSS input, not the documented one', () => {
    // m3e 2.6.2 documents `--m3e-loading-indicator-active-indicator-size` but its
    // implementation reads `--m3e-loading-indicator-size`; this is the accepted
    // controlled workaround recorded in README.md.
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: 40 } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('style')).toBe('--m3e-loading-indicator-size: 40px;');
  });
});
