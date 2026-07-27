import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MDLoadingIndicator from './MDLoadingIndicator.vue';

describe('MDLoadingIndicator adapter', () => {
  it('renders the canonical renderer element with the progressbar role and the accessible purpose label', () => {
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading news article' } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('aria-label')).toBe('Loading news article');
  });

  describe('overall host geometry', () => {
    it('sizes the host to the official default overall size of 48 when no size is supplied', () => {
      const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading' } });
      const indicator = wrapper.get('m3e-loading-indicator');

      expect(indicator.attributes('style')).toContain('width: 48px');
      expect(indicator.attributes('style')).toContain('height: 48px');
    });

    it('sizes the host to an explicit valid overall size', () => {
      const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: 32 } });
      const indicator = wrapper.get('m3e-loading-indicator');

      expect(indicator.attributes('style')).toContain('width: 32px');
      expect(indicator.attributes('style')).toContain('height: 32px');
    });
  });

  describe('private active-size mapping', () => {
    it.each([
      [48, '38px'],
      [24, '19px'],
    ])('maps overall size %spx to the private active-size input %s', (size, expected) => {
      const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size } });
      const indicator = wrapper.get('m3e-loading-indicator');

      expect(indicator.attributes('style')).toContain(`--m3e-loading-indicator-size: ${expected}`);
    });

    it('maps overall size 32px to the private active-size input at approximately 25.333333px', () => {
      const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: 32 } });
      const indicator = wrapper.get('m3e-loading-indicator');
      const style = indicator.attributes('style') ?? '';
      const match = /--m3e-loading-indicator-size: ([\d.]+)px/.exec(style);

      expect(match).not.toBeNull();
      expect(Number(match?.[1])).toBeCloseTo(25.333333, 5);
    });

    it('maps overall size 40px to the private active-size input at approximately 31.666667px', () => {
      const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: 40 } });
      const indicator = wrapper.get('m3e-loading-indicator');
      const style = indicator.attributes('style') ?? '';
      const match = /--m3e-loading-indicator-size: ([\d.]+)px/.exec(style);

      expect(match).not.toBeNull();
      expect(Number(match?.[1])).toBeCloseTo(31.666667, 5);
    });
  });

  describe('validation behavior', () => {
    it('clamps an overall size below the accepted 24-240 range to the lower bound and warns in development', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: 8 } });
      const indicator = wrapper.get('m3e-loading-indicator');

      expect(indicator.attributes('style')).toContain('width: 24px');
      expect(indicator.attributes('style')).toContain('height: 24px');
      expect(indicator.attributes('style')).toContain('--m3e-loading-indicator-size: 19px');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('must be between 24 and 240'));

      warnSpy.mockRestore();
    });

    it('clamps an overall size above the accepted 24-240 range to the upper bound and warns in development', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: 480 } });
      const indicator = wrapper.get('m3e-loading-indicator');

      expect(indicator.attributes('style')).toContain('width: 240px');
      expect(indicator.attributes('style')).toContain('height: 240px');
      expect(indicator.attributes('style')).toContain('--m3e-loading-indicator-size: 190px');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('must be between 24 and 240'));

      warnSpy.mockRestore();
    });

    it.each([
      ['NaN', NaN, 'must be a finite number'],
      ['infinite', Infinity, 'must be a finite number'],
      ['negative-infinite', -Infinity, 'must be a finite number'],
    ])(
      'normalizes a %s overall size to the default 48 and warns in development',
      (_label, size, warningText) => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size } });
        const indicator = wrapper.get('m3e-loading-indicator');
        const style = indicator.attributes('style') ?? '';

        expect(style).toContain('width: 48px');
        expect(style).toContain('height: 48px');
        expect(style).toContain('--m3e-loading-indicator-size: 38px');
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(warningText));

        warnSpy.mockRestore();
      },
    );
  });
});
