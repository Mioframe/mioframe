import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import MDLoadingIndicator from './MDLoadingIndicator.vue';

describe('MDLoadingIndicator adapter', () => {
  it('renders the canonical renderer element with the progressbar role and the accessible purpose label', () => {
    const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading news article' } });
    const indicator = wrapper.get('m3e-loading-indicator');

    expect(indicator.attributes('aria-label')).toBe('Loading news article');
  });

  it('keeps public color overrides on the renderer host', () => {
    const wrapper = mount(MDLoadingIndicator, {
      attrs: { style: '--md-comp-loading-indicator-active-indicator-color: #006e1c' },
      props: { label: 'Loading' },
    });

    expect(wrapper.get('m3e-loading-indicator').attributes('style')).toContain(
      '--md-comp-loading-indicator-active-indicator-color: #006e1c',
    );
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

    it('restores exact geometry and active-size mapping after an invalid size is replaced', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const wrapper = mount(MDLoadingIndicator, { props: { label: 'Loading', size: Infinity } });

      expect(wrapper.get('m3e-loading-indicator').attributes('style')).toContain('width: 48px');

      await wrapper.setProps({ size: 32 });
      const style = wrapper.get('m3e-loading-indicator').attributes('style') ?? '';
      expect(style).toContain('width: 32px');
      expect(style).toContain('height: 32px');
      expect(Number(/--m3e-loading-indicator-size: ([\d.]+)px/.exec(style)?.[1])).toBeCloseTo(
        25.333333,
        5,
      );

      warnSpy.mockRestore();
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

  describe('Host-attribute boundary', () => {
    it('sets inheritAttrs to false and does not spread $attrs automatically', () => {
      // A raw, non-allow-listed attribute must not land on the host even though
      // Vue's default automatic fallthrough would normally place it there.
      const wrapper = mount(MDLoadingIndicator, {
        attrs: { 'data-not-checked-here': undefined, foo: 'bar' },
        props: { label: 'Loading' },
      });
      const indicator = wrapper.get('m3e-loading-indicator');

      expect(indicator.attributes('foo')).toBeUndefined();
    });

    it('merges a consumer class with the internal md-loading-indicator class instead of replacing it', () => {
      const wrapper = mount(MDLoadingIndicator, {
        attrs: { class: 'consumer-class' },
        props: { label: 'Loading' },
      });
      const indicator = wrapper.get('m3e-loading-indicator');

      expect(indicator.classes()).toContain('md-loading-indicator');
      expect(indicator.classes()).toContain('consumer-class');
    });

    it('forwards id, title, aria-describedby, and data-* attributes as-is', () => {
      const wrapper = mount(MDLoadingIndicator, {
        attrs: {
          'data-testid': 'library-loading-indicator',
          'aria-describedby': 'loading-help',
          id: 'library-loading',
          title: 'Loading title',
        },
        props: { label: 'Loading' },
      });
      const indicator = wrapper.get('m3e-loading-indicator');

      expect(indicator.attributes('id')).toBe('library-loading');
      expect(indicator.attributes('title')).toBe('Loading title');
      expect(indicator.attributes('data-testid')).toBe('library-loading-indicator');
      expect(indicator.attributes('aria-describedby')).toBe('loading-help');
    });

    it('forwards aria-hidden="true" so Button can suppress standalone semantics', () => {
      const wrapper = mount(MDLoadingIndicator, {
        attrs: { 'aria-hidden': 'true' },
        props: { label: 'Loading' },
      });
      const indicator = wrapper.get('m3e-loading-indicator');

      expect(indicator.attributes('aria-hidden')).toBe('true');
    });

    it('merges a consumer style with the internal geometry style without breaking the M3E-001/M3E-002 workaround', () => {
      const wrapper = mount(MDLoadingIndicator, {
        attrs: {
          style: 'width: 999px; height: 999px; --m3e-loading-indicator-size: 999px',
        },
        props: { label: 'Loading', size: 32 },
      });
      const indicator = wrapper.get('m3e-loading-indicator');
      const style = indicator.attributes('style') ?? '';

      // Internal geometry always wins on a conflicting key.
      expect(style).toContain('width: 32px');
      expect(style).toContain('height: 32px');
      expect(style).not.toContain('999px');
      const match = /--m3e-loading-indicator-size: ([\d.]+)px/.exec(style);
      expect(match).not.toBeNull();
      expect(Number(match?.[1])).toBeCloseTo(25.333333, 5);
    });

    it('still forwards a consumer public Material token style override, a different key from the protected geometry keys', () => {
      const wrapper = mount(MDLoadingIndicator, {
        attrs: {
          style: '--md-comp-loading-indicator-active-indicator-color: #006e1c; width: 999px',
        },
        props: { label: 'Loading' },
      });
      const indicator = wrapper.get('m3e-loading-indicator');
      const style = indicator.attributes('style') ?? '';

      expect(style).toContain('--md-comp-loading-indicator-active-indicator-color: #006e1c');
      // The protected width key is still not overridden by the same consumer style object.
      expect(style).toContain('width: 48px');
      expect(style).not.toContain('999px');
    });

    it.each([
      ['renderer variant', { variant: 'contained' }, 'variant'],
      ['contained state', { contained: 'true' }, 'contained'],
      ['role override', { role: 'alert' }, 'role'],
      ['tabindex override', { tabindex: '0' }, 'tabindex'],
      ['aria-valuenow', { 'aria-valuenow': '50' }, 'aria-valuenow'],
      ['aria-valuemin', { 'aria-valuemin': '0' }, 'aria-valuemin'],
      ['aria-valuemax', { 'aria-valuemax': '100' }, 'aria-valuemax'],
      [
        'an arbitrary unknown attribute',
        { 'data-not-forwarded': undefined, unknown: 'value' },
        'unknown',
      ],
    ])('does not forward %s to the renderer host', (_label, attrs, checkedAttribute) => {
      const wrapper = mount(MDLoadingIndicator, {
        attrs,
        props: { label: 'Loading' },
      });
      const indicator = wrapper.get('m3e-loading-indicator');

      expect(indicator.attributes(checkedAttribute)).toBeUndefined();
    });

    it('does not attach an arbitrary listener passed via attrs to the renderer host', async () => {
      const onClick = vi.fn();
      const wrapper = mount(MDLoadingIndicator, {
        attrs: { onClick },
        props: { label: 'Loading' },
      });
      const indicator = wrapper.get('m3e-loading-indicator');

      await indicator.trigger('click');

      expect(onClick).not.toHaveBeenCalled();
    });

    it('keeps label as the effective accessible-purpose source; a consumer-passed aria-label cannot override it', () => {
      const wrapper = mount(MDLoadingIndicator, {
        attrs: { 'aria-label': 'Consumer override' },
        props: { label: 'Loading news article' },
      });
      const indicator = wrapper.get('m3e-loading-indicator');

      expect(indicator.attributes('aria-label')).toBe('Loading news article');
    });

    it('keeps forwarded class, style, id, title, data-*, aria-hidden, and aria-describedby reactive to consumer changes', async () => {
      const wrapper = mount(
        {
          components: { MDLoadingIndicator },
          data(): {
            describedBy: string;
            hidden: string | undefined;
            hostClass: string;
            hostId: string;
            hostTestId: string;
            hostTitle: string;
            overrideColor: string;
          } {
            return {
              describedBy: 'first-help',
              hidden: 'true',
              hostClass: 'first-class',
              hostId: 'first-id',
              hostTestId: 'first-test-id',
              hostTitle: 'First title',
              overrideColor: '#006e1c',
            };
          },
          template: `
            <MDLoadingIndicator
              label="Loading"
              :aria-describedby="describedBy"
              :aria-hidden="hidden"
              :class="hostClass"
              :data-testid="hostTestId"
              :id="hostId"
              :style="'--md-comp-loading-indicator-active-indicator-color: ' + overrideColor"
              :title="hostTitle"
            />
          `,
        },
        {},
      );
      const indicator = wrapper.get('m3e-loading-indicator');

      expect(indicator.classes()).toContain('first-class');
      expect(indicator.attributes('id')).toBe('first-id');
      expect(indicator.attributes('title')).toBe('First title');
      expect(indicator.attributes('data-testid')).toBe('first-test-id');
      expect(indicator.attributes('aria-describedby')).toBe('first-help');
      expect(indicator.attributes('aria-hidden')).toBe('true');
      expect(indicator.attributes('style')).toContain(
        '--md-comp-loading-indicator-active-indicator-color: #006e1c',
      );

      await wrapper.setData({
        describedBy: 'second-help',
        hidden: undefined,
        hostClass: 'second-class',
        hostId: 'second-id',
        hostTestId: 'second-test-id',
        hostTitle: 'Second title',
        overrideColor: '#6750a4',
      });

      const updatedIndicator = wrapper.get('m3e-loading-indicator');
      expect(updatedIndicator.classes()).toContain('second-class');
      expect(updatedIndicator.classes()).not.toContain('first-class');
      expect(updatedIndicator.attributes('id')).toBe('second-id');
      expect(updatedIndicator.attributes('title')).toBe('Second title');
      expect(updatedIndicator.attributes('data-testid')).toBe('second-test-id');
      expect(updatedIndicator.attributes('aria-describedby')).toBe('second-help');
      expect(updatedIndicator.attributes('aria-hidden')).toBeUndefined();
      expect(updatedIndicator.attributes('style')).toContain(
        '--md-comp-loading-indicator-active-indicator-color: #6750a4',
      );
    });

    it('projects an allow-listed attribute and a data-* key from render-time attrs across add/remove/re-add, and keeps rejecting a dynamically added forbidden attribute/listener', async () => {
      const onClick = vi.fn();
      const dynamicAttrs = ref<Record<string, unknown>>({});
      const Wrapper = defineComponent({
        components: { MDLoadingIndicator },
        setup: () => ({ dynamicAttrs }),
        template: '<MDLoadingIndicator label="Loading" v-bind="dynamicAttrs" />',
      });
      const wrapper = mount(Wrapper);
      const getIndicator = () => wrapper.get('m3e-loading-indicator');

      expect(getIndicator().attributes('id')).toBeUndefined();

      dynamicAttrs.value = { id: 'first-id' };
      await wrapper.vm.$nextTick();
      expect(getIndicator().attributes('id')).toBe('first-id');

      dynamicAttrs.value = {};
      await wrapper.vm.$nextTick();
      expect(getIndicator().attributes('id')).toBeUndefined();

      dynamicAttrs.value = { id: 'second-id' };
      await wrapper.vm.$nextTick();
      expect(getIndicator().attributes('id')).toBe('second-id');

      expect(getIndicator().attributes('data-testid')).toBeUndefined();
      dynamicAttrs.value = { id: 'second-id', 'data-testid': 'library-loading-indicator' };
      await wrapper.vm.$nextTick();
      expect(getIndicator().attributes('data-testid')).toBe('library-loading-indicator');

      dynamicAttrs.value = { id: 'second-id' };
      await wrapper.vm.$nextTick();
      expect(getIndicator().attributes('data-testid')).toBeUndefined();

      dynamicAttrs.value = { id: 'second-id', onClick, role: 'alert' };
      await wrapper.vm.$nextTick();
      expect(getIndicator().attributes('role')).toBeUndefined();
      await getIndicator().trigger('click');
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
