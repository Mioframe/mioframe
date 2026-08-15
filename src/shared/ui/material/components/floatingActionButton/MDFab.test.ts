import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import MDFab from './MDFab.vue';

// Filled Material-compatible "add" glyph (ARCHITECTURE.md "Implementation passes" #5), matching
// the canonical Storybook fixture: a single solid contour, no `stroke`/`fill="none"`.
const directSvgIcon = `
  <svg data-icon viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
`;

const mountFab = (props: Record<string, unknown> = {}) =>
  mount(MDFab, {
    props: { label: 'Compose', ...props },
    slots: { icon: directSvgIcon },
  });

const getElementProperty = (element: Element, property: string): unknown =>
  Reflect.get(element, property);

/** Shared reactive-attrs test harness: mounts MDFab behind a parent whose `v-bind` object can change. */
const DynamicAttrsWrapper = defineComponent({
  components: { MDFab },
  props: {
    attrs: { default: () => ({}), type: Object },
  },
  template: `
    <MDFab label="Compose" v-bind="attrs">
      <template #icon>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </template>
    </MDFab>
  `,
});

describe('MDFab adapter', () => {
  it('always renders the medium/primary-container renderer constants', () => {
    const fab = mountFab().get('m3e-fab');

    expect(getElementProperty(fab.element, 'variant')).toBe('primary-container');
    expect(getElementProperty(fab.element, 'size')).toBe('medium');
  });

  it('maps the required label prop to aria-label', () => {
    const fab = mountFab({ label: 'Compose a new message' }).get('m3e-fab');

    expect(fab.attributes('aria-label')).toBe('Compose a new message');
  });

  it('renders the required icon slot as the renderer default slot content', () => {
    const wrapper = mountFab();
    const fab = wrapper.get('m3e-fab');

    const icon = fab.get('[data-icon]');
    expect(icon.element.tagName).toBe('svg');
    expect(icon.attributes('slot')).toBeUndefined();
    expect(icon.attributes('aria-hidden')).toBe('true');
    expect(icon.attributes('viewBox')).toBe('0 0 24 24');
  });

  it('warns in DEV when the icon slot is empty', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mount(MDFab, { props: { label: 'Compose' } });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('must render exactly one direct inline SVG root'),
    );

    warnSpy.mockRestore();
  });

  it('does not warn when the icon slot is provided', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mountFab();

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('warns in DEV when the icon slot is bare text and leaves the supplied content unchanged', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const wrapper = mount(MDFab, {
      props: { label: 'Compose' },
      slots: { icon: '+' },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('must render exactly one direct inline SVG root'),
    );
    expect(wrapper.get('m3e-fab').text()).toBe('+');

    warnSpy.mockRestore();
  });

  it('forwards the renderer click payload unchanged', async () => {
    const wrapper = mountFab();
    const event = new MouseEvent('click');

    wrapper.get('m3e-fab').element.dispatchEvent(event);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('click')).toEqual([[event]]);
  });

  describe('host-attribute boundary', () => {
    it('forwards the allowed class/style/id/title/data-* attributes to the host', () => {
      const wrapper = mount(MDFab, {
        attrs: {
          class: 'consumer-class',
          'data-testid': 'add-fab',
          id: 'add-action',
          style: { color: 'red' },
          title: 'Add item',
        },
        props: { label: 'Add' },
        slots: { icon: directSvgIcon },
      });
      const fab = wrapper.get('m3e-fab');

      expect(fab.attributes('id')).toBe('add-action');
      expect(fab.attributes('title')).toBe('Add item');
      expect(fab.attributes('data-testid')).toBe('add-fab');
    });

    it('merges consumer class/style with the internal md-fab class instead of replacing it', () => {
      const wrapper = mount(MDFab, {
        attrs: { class: 'consumer-class', style: { color: 'red' } },
        props: { label: 'Add' },
        slots: { icon: directSvgIcon },
      });
      const fab = wrapper.get('m3e-fab');

      expect(fab.classes()).toContain('md-fab');
      expect(fab.classes()).toContain('consumer-class');
      expect(fab.attributes('style')).toContain('color: red');
    });

    it('stays reactive to allowed forwarded attribute changes', async () => {
      const wrapper = mount(DynamicAttrsWrapper, { props: { attrs: { id: 'initial-id' } } });
      const fab = wrapper.get('m3e-fab');
      expect(fab.attributes('id')).toBe('initial-id');

      await wrapper.setProps({ attrs: { id: 'updated-id' } });
      expect(fab.attributes('id')).toBe('updated-id');
    });

    it('does not forward disabled, disabled-interactive, lowered, extended, link/form attributes, variant/size, or an unknown attribute, and adapter-owned bindings win', () => {
      const wrapper = mount(MDFab, {
        attrs: {
          'bogus-consumer-flag': 'leak-attempt',
          'aria-label': 'Ignored consumer label',
          disabled: true,
          'disabled-interactive': true,
          download: 'file.txt',
          extended: true,
          href: 'https://example.test',
          lowered: true,
          name: 'bogus-name',
          rel: 'noopener',
          size: 'large',
          target: '_blank',
          type: 'submit',
          value: 'bogus-value',
          variant: 'primary',
        },
        props: { label: 'Add' },
        slots: { icon: directSvgIcon },
      });
      const fab = wrapper.get('m3e-fab');

      expect(getElementProperty(fab.element, 'variant')).toBe('primary-container');
      expect(getElementProperty(fab.element, 'size')).toBe('medium');
      expect(getElementProperty(fab.element, 'disabled')).toBe(false);
      expect(getElementProperty(fab.element, 'lowered')).toBe(false);
      expect(getElementProperty(fab.element, 'extended')).toBe(false);
      expect(fab.attributes('aria-label')).toBe('Add');
      expect(fab.attributes('bogus-consumer-flag')).toBeUndefined();
      expect(fab.attributes('href')).toBeUndefined();
      expect(fab.attributes('name')).toBeUndefined();
    });

    it('does not attach an undeclared listener to the host', async () => {
      const onBeforeinput = vi.fn();
      const wrapper = mount(MDFab, {
        attrs: { onBeforeinput },
        props: { label: 'Add' },
        slots: { icon: directSvgIcon },
      });
      const fab = wrapper.get('m3e-fab');

      fab.element.dispatchEvent(new Event('beforeinput'));
      await wrapper.vm.$nextTick();

      expect(onBeforeinput).not.toHaveBeenCalled();
    });

    it('projects an allow-listed attribute and a data-* key from render-time attrs across add/remove/re-add, and keeps rejecting a dynamically added forbidden attribute', async () => {
      const wrapper = mount(DynamicAttrsWrapper, { props: { attrs: {} } });
      const getFab = () => wrapper.get('m3e-fab');

      expect(getFab().attributes('id')).toBeUndefined();

      await wrapper.setProps({ attrs: { id: 'first-id' } });
      expect(getFab().attributes('id')).toBe('first-id');

      await wrapper.setProps({ attrs: {} });
      expect(getFab().attributes('id')).toBeUndefined();

      await wrapper.setProps({ attrs: { id: 'second-id' } });
      expect(getFab().attributes('id')).toBe('second-id');

      expect(getFab().attributes('data-testid')).toBeUndefined();
      await wrapper.setProps({ attrs: { 'data-testid': 'add-fab', id: 'second-id' } });
      expect(getFab().attributes('data-testid')).toBe('add-fab');

      await wrapper.setProps({ attrs: { id: 'second-id' } });
      expect(getFab().attributes('data-testid')).toBeUndefined();

      await wrapper.setProps({ attrs: { id: 'second-id', size: 'large', variant: 'primary' } });
      expect(getElementProperty(getFab().element, 'size')).toBe('medium');
      expect(getElementProperty(getFab().element, 'variant')).toBe('primary-container');
    });
  });
});
