import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import MDExtendedFab from './MDExtendedFab.vue';

// Filled Material-compatible "add" glyph (ARCHITECTURE.md "Implementation passes" #5), matching
// the canonical Storybook fixture: a single solid contour, no `stroke`/`fill="none"`.
const directSvgIcon = `
  <svg data-icon viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
`;

const mountExtendedFab = (props: Record<string, unknown> = {}) =>
  mount(MDExtendedFab, {
    props: { label: 'Add', ...props },
    slots: { icon: directSvgIcon },
  });

const getElementProperty = (element: Element, property: string): unknown =>
  Reflect.get(element, property);

/** Shared reactive-attrs test harness: mounts MDExtendedFab behind a parent whose `v-bind` object can change. */
const DynamicAttrsWrapper = defineComponent({
  components: { MDExtendedFab },
  props: {
    attrs: { default: () => ({}), type: Object },
  },
  template: `
    <MDExtendedFab label="Add" v-bind="attrs">
      <template #icon>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </template>
    </MDExtendedFab>
  `,
});

describe('MDExtendedFab adapter', () => {
  it('always renders the small/primary-container/extended renderer constants', () => {
    const fab = mountExtendedFab().get('m3e-fab');

    expect(getElementProperty(fab.element, 'variant')).toBe('primary-container');
    expect(getElementProperty(fab.element, 'size')).toBe('small');
    expect(getElementProperty(fab.element, 'extended')).toBe(true);
  });

  it('maps the required label prop to aria-label', () => {
    const fab = mountExtendedFab({ label: 'Add a new item' }).get('m3e-fab');

    expect(fab.attributes('aria-label')).toBe('Add a new item');
  });

  it('renders the required label prop as visible text in the renderer named label slot', () => {
    const fab = mountExtendedFab({ label: 'Add a new item' }).get('m3e-fab');

    const label = fab.get('[slot="label"]');
    expect(label.text()).toBe('Add a new item');
  });

  it('renders the optional icon slot as the renderer default slot content when present', () => {
    const wrapper = mountExtendedFab();
    const fab = wrapper.get('m3e-fab');

    const icon = fab.get('[data-icon]');
    expect(icon.element.tagName).toBe('svg');
    expect(icon.attributes('slot')).toBeUndefined();
    expect(icon.attributes('aria-hidden')).toBe('true');
    expect(icon.attributes('viewBox')).toBe('0 0 24 24');
  });

  it('renders label-only with no icon content when the icon slot is omitted', () => {
    const wrapper = mount(MDExtendedFab, { props: { label: 'Add' } });
    const fab = wrapper.get('m3e-fab');

    expect(fab.find('svg').exists()).toBe(false);
    expect(fab.get('[slot="label"]').text()).toBe('Add');
  });

  it('does not warn in DEV when the icon slot is empty (icon is optional)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mount(MDExtendedFab, { props: { label: 'Add' } });

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('does not warn when the icon slot is provided with a valid direct SVG', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mountExtendedFab();

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('warns in DEV when the icon slot is bare text and leaves the supplied content unchanged', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const wrapper = mount(MDExtendedFab, {
      props: { label: 'Add' },
      slots: { icon: '+' },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('must render exactly one direct inline SVG root'),
    );
    expect(wrapper.get('m3e-fab').text()).toContain('+');

    warnSpy.mockRestore();
  });

  it('warns in DEV when the icon slot renders more than one element', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mount(MDExtendedFab, {
      props: { label: 'Add' },
      slots: {
        icon: `
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M0 0h1v1H0z" /></svg>
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M0 0h1v1H0z" /></svg>
        `,
      },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('must render exactly one direct inline SVG root'),
    );

    warnSpy.mockRestore();
  });

  it('forwards the renderer click payload unchanged', async () => {
    const wrapper = mountExtendedFab();
    const event = new MouseEvent('click');

    wrapper.get('m3e-fab').element.dispatchEvent(event);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('click')).toEqual([[event]]);
  });

  describe('host-attribute boundary', () => {
    it('forwards the allowed class/style/id/title/data-* attributes to the host', () => {
      const wrapper = mount(MDExtendedFab, {
        attrs: {
          class: 'consumer-class',
          'data-testid': 'add-extended-fab',
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
      expect(fab.attributes('data-testid')).toBe('add-extended-fab');
    });

    it('merges consumer class/style with the internal md-extended-fab class instead of replacing it', () => {
      const wrapper = mount(MDExtendedFab, {
        attrs: { class: 'consumer-class', style: { color: 'red' } },
        props: { label: 'Add' },
        slots: { icon: directSvgIcon },
      });
      const fab = wrapper.get('m3e-fab');

      expect(fab.classes()).toContain('md-extended-fab');
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

    it('does not forward disabled, disabled-interactive, lowered, extended, link/form attributes, size/variant, or an unknown attribute, and adapter-owned bindings win', () => {
      const wrapper = mount(MDExtendedFab, {
        attrs: {
          'bogus-consumer-flag': 'leak-attempt',
          'aria-label': 'Ignored consumer label',
          disabled: true,
          'disabled-interactive': true,
          download: 'file.txt',
          extended: false,
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
      expect(getElementProperty(fab.element, 'size')).toBe('small');
      expect(getElementProperty(fab.element, 'extended')).toBe(true);
      expect(getElementProperty(fab.element, 'disabled')).toBe(false);
      expect(getElementProperty(fab.element, 'lowered')).toBe(false);
      expect(fab.attributes('aria-label')).toBe('Add');
      expect(fab.attributes('bogus-consumer-flag')).toBeUndefined();
      expect(fab.attributes('href')).toBeUndefined();
      expect(fab.attributes('name')).toBeUndefined();
    });

    it('does not attach an undeclared listener to the host', async () => {
      const onBeforeinput = vi.fn();
      const wrapper = mount(MDExtendedFab, {
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
      await wrapper.setProps({ attrs: { 'data-testid': 'add-extended-fab', id: 'second-id' } });
      expect(getFab().attributes('data-testid')).toBe('add-extended-fab');

      await wrapper.setProps({ attrs: { id: 'second-id' } });
      expect(getFab().attributes('data-testid')).toBeUndefined();

      await wrapper.setProps({
        attrs: { extended: false, id: 'second-id', size: 'large', variant: 'primary' },
      });
      expect(getElementProperty(getFab().element, 'size')).toBe('small');
      expect(getElementProperty(getFab().element, 'variant')).toBe('primary-container');
      expect(getElementProperty(getFab().element, 'extended')).toBe(true);
    });
  });
});
