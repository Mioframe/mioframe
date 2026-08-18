import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MDExtendedFloatingActionButton from './MDExtendedFloatingActionButton.vue';

const icon = `
  <svg data-icon viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
`;

const getElementProperty = (element: Element, property: string): unknown =>
  Reflect.get(element, property);

const getElementStyle = (element: Element, property: string): string => {
  if (!(element instanceof HTMLElement)) {
    throw new TypeError('Expected an HTML element.');
  }

  return element.style.getPropertyValue(property);
};

describe('MDExtendedFloatingActionButton adapter', () => {
  it('maps the canonical small default and its content roles to one extended renderer host', () => {
    const wrapper = mount(MDExtendedFloatingActionButton, {
      slots: { default: 'Create note' },
    });
    const fab = wrapper.get('m3e-fab');

    expect(Reflect.get(fab.element, 'extended')).toBe(true);
    expect(Reflect.get(fab.element, 'size')).toBe('small');
    expect(fab.get('[slot="label"]').text()).toBe('Create note');
  });

  it.each(['small', 'medium', 'large'] as const)(
    'maps the public %s size to the renderer host',
    (size) => {
      const fab = mount(MDExtendedFloatingActionButton, {
        props: { size },
        slots: { default: 'Create note' },
      }).get('m3e-fab');

      expect(getElementProperty(fab.element, 'size')).toBe(size);
    },
  );

  it.each([
    'primary-container',
    'secondary-container',
    'tertiary-container',
    'primary',
    'secondary',
    'tertiary',
  ] as const)('maps the public %s color to the renderer host', (color) => {
    const fab = mount(MDExtendedFloatingActionButton, {
      props: { color },
      slots: { default: 'Create note' },
    }).get('m3e-fab');

    expect(getElementProperty(fab.element, 'variant')).toBe(color);
  });

  it.each([
    'primary-container',
    'secondary-container',
    'tertiary-container',
    'primary',
    'secondary',
    'tertiary',
  ] as const)(
    'selects the %s color-mapping class that carries the private renderer token bridge in CSS',
    (color) => {
      const fab = mount(MDExtendedFloatingActionButton, {
        props: { color },
        slots: { default: 'Create note' },
      }).get('m3e-fab');

      expect(fab.classes()).toContain(`md-extended-floating-action-button_color_${color}`);
    },
  );

  it('projects the optional icon to the renderer default slot and keeps the label role separate', () => {
    const fab = mount(MDExtendedFloatingActionButton, {
      slots: { default: 'Create note', icon },
    }).get('m3e-fab');

    const renderedIcon = fab.get('[data-icon]');
    expect(renderedIcon.element.tagName).toBe('svg');
    expect(renderedIcon.attributes('slot')).toBeUndefined();
    expect(renderedIcon.attributes('aria-hidden')).toBe('true');
    expect(fab.get('[slot="label"]').text()).toBe('Create note');
  });

  it('emits the typed click event with the unchanged native activation event', async () => {
    const wrapper = mount(MDExtendedFloatingActionButton, {
      slots: { default: 'Create note' },
    });
    const event = new MouseEvent('click');

    wrapper.get('m3e-fab').element.dispatchEvent(event);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('click')).toEqual([[event]]);
  });

  describe('host-attribute boundary', () => {
    it('forwards only the allowed class, style, id, title, and data attributes', () => {
      const fab = mount(MDExtendedFloatingActionButton, {
        attrs: {
          class: 'consumer-class',
          'data-testid': 'create-note',
          id: 'create-note-action',
          style: {
            '--md-comp-extended-fab-primary-container-container-color': 'red',
            color: 'red',
          },
          title: 'Create note',
        },
        slots: { default: 'Create note' },
      }).get('m3e-fab');

      expect(fab.attributes('id')).toBe('create-note-action');
      expect(fab.attributes('title')).toBe('Create note');
      expect(fab.attributes('data-testid')).toBe('create-note');
      expect(fab.classes()).toContain('md-extended-floating-action-button');
      expect(fab.classes()).toContain('md-extended-floating-action-button_color_primary-container');
      expect(fab.classes()).toContain('consumer-class');
      expect(fab.attributes('style')).toContain('color: red');
      expect(
        getElementStyle(fab.element, '--md-comp-extended-fab-primary-container-container-color'),
      ).toBe('red');
    });

    it('rejects renderer-only configuration, non-canonical action attributes, ARIA overrides, and undeclared listeners', async () => {
      const onBeforeinput = vi.fn();
      const wrapper = mount(MDExtendedFloatingActionButton, {
        attrs: {
          'aria-label': 'Unrelated action',
          'bogus-consumer-flag': 'leak-attempt',
          disabled: true,
          extended: false,
          href: 'https://example.test',
          lowered: true,
          name: 'create',
          onBeforeinput,
          type: 'submit',
          variant: 'primary',
        },
        slots: { default: 'Create note' },
      });
      const fab = wrapper.get('m3e-fab');

      expect(getElementProperty(fab.element, 'extended')).toBe(true);
      expect(getElementProperty(fab.element, 'size')).toBe('small');
      expect(getElementProperty(fab.element, 'variant')).toBe('primary-container');
      expect(getElementProperty(fab.element, 'disabled')).toBe(false);
      expect(fab.attributes('aria-label')).toBeUndefined();
      expect(fab.attributes('bogus-consumer-flag')).toBeUndefined();
      expect(fab.attributes('href')).toBeUndefined();
      expect(fab.attributes('name')).toBeUndefined();

      fab.element.dispatchEvent(new Event('beforeinput'));
      await wrapper.vm.$nextTick();

      expect(onBeforeinput).not.toHaveBeenCalled();
    });
  });
});
