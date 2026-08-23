/* eslint-disable vue/one-component-per-file, @typescript-eslint/consistent-type-assertions -- Focused child stubs and branded fixture identities stay local to this contract test. */
import { mount } from '@vue/test-utils';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseItemId, DatabasePropertyId } from '@shared/lib/databaseDocument';
import { ref, defineComponent, h, type Ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import EditableInlineValue from './EditableInlineValue.vue';

vi.mock('@entity/databaseProperty', () => ({
  useDatabaseProperty: () => ({
    property: ref({ name: 'Title', type: 'string' }),
  }),
}));

vi.mock('@entity/databaseValue', () => ({
  useDatabaseEffectiveValue: () => ({ value: ref('initial') }),
  useDatabaseStoredValue: () => ({ post: vi.fn() }),
}));

vi.mock('@shared/ui/State', () => ({
  MDStateLayer: defineComponent({ render: () => h('div', { class: 'md-state-layer' }) }),
  useRipple: vi.fn((target: Readonly<Ref<HTMLElement | null>>) => target),
  useStateLayer: vi.fn((target: Readonly<Ref<HTMLElement | null>>) => ({
    hover: ref(false),
    focused: ref(false),
    durationPressedState: ref(false),
    target,
  })),
}));

vi.mock('@shared/ui/Tooltips', () => ({
  MDOverlayTooltip: defineComponent({
    props: {
      show: {
        type: Boolean,
        required: true,
      },
    },
    setup(props, { slots }) {
      return () => (props.show ? h('div', slots.default?.()) : undefined);
    },
  }),
}));

vi.mock('@shared/ui/Checkbox', () => ({ toggleBoolean: vi.fn() }));
vi.mock('@shared/lib/validateZodScheme', () => ({
  zodIs: (value: { type?: string }, schema: { type: string }) => value.type === schema.type,
}));
vi.mock('@entity/databaseString', () => ({ zodStringProperty: { type: 'string' } }));
vi.mock('@entity/databaseBoolean', () => ({ zodBooleanProperty: { type: 'boolean' } }));
vi.mock('./DatabasePropertyValueFieldById.vue', () => ({
  default: defineComponent({ name: 'DatabasePropertyValueFieldById' }),
}));
vi.mock('./ValueInline.vue', () => ({
  default: defineComponent({ name: 'ValueInline' }),
}));

const ValueFieldStub = defineComponent({
  name: 'DatabasePropertyValueFieldById',
  props: {
    value: { required: true, type: String },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        value: props.value,
        onInput: (event: Event) => {
          const input = event.target;

          if (input instanceof HTMLInputElement) {
            emit('update:value', input.value);
          }
        },
      });
  },
});

describe('EditableInlineValue', () => {
  const itemId = 'itemId-test' as DatabaseItemId;
  const propertyId = 'propertyId-test' as DatabasePropertyId;
  const documentId = 'document-test' as AMDocumentId;

  const mountEditor = (resolving: boolean) =>
    mount(EditableInlineValue, {
      props: {
        itemId,
        propertyId,
        directoryPath: '/database',
        documentId,
        editSession: { draft: 'recoverable draft', resolving },
      },
      global: {
        stubs: { DatabasePropertyValueFieldById: ValueFieldStub, ValueInline: true },
      },
    });

  it('detaches Material interaction feedback while resolving and restores the exact draft on recovery', async () => {
    const wrapper = mountEditor(false);
    const inlineRoot = wrapper.find('.editable-inline-value').element;
    const stateModule = await import('@shared/ui/State');
    const stateLayerTarget = vi.mocked(stateModule.useStateLayer).mock.results.at(-1)?.value
      .target as Ref<HTMLElement | null>;
    const rippleTarget = vi
      .mocked(stateModule.useRipple)
      .mock.calls.at(-1)?.[0] as Ref<HTMLElement | null>;

    expect(stateLayerTarget.value).toBe(inlineRoot);
    expect(rippleTarget.value).toBe(inlineRoot);
    expect(wrapper.find('.editable-inline-value_interactive').exists()).toBe(true);
    expect(wrapper.find('.md-state-layer').exists()).toBe(true);
    expect(wrapper.find('input').exists()).toBe(true);
    await wrapper.find('input').setValue('changed draft');
    expect(wrapper.emitted('update:draft')).toEqual([['changed draft']]);

    await wrapper.setProps({ editSession: { draft: 'recoverable draft', resolving: true } });
    expect(stateLayerTarget.value).toBeNull();
    expect(rippleTarget.value).toBeNull();
    expect(wrapper.find('.editable-inline-value_interactive').exists()).toBe(false);
    expect(wrapper.find('.md-state-layer').exists()).toBe(false);
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.attributes('tabindex')).toBeUndefined();
    await wrapper.trigger('click');
    await wrapper.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('cancelEdit')).toBeUndefined();
    expect(wrapper.emitted('requestEdit')).toBeUndefined();
    expect(wrapper.emitted('update:draft')).toEqual([['changed draft']]);

    await wrapper.setProps({ editSession: { draft: 'recoverable draft', resolving: false } });
    expect(stateLayerTarget.value).toBe(inlineRoot);
    expect(rippleTarget.value).toBe(inlineRoot);
    expect(wrapper.find('.editable-inline-value_interactive').exists()).toBe(true);
    expect(wrapper.find('.md-state-layer').exists()).toBe(true);
    expect(wrapper.find('input').element).toHaveProperty('value', 'recoverable draft');
    await wrapper.find('input').setValue('recovered draft');
    expect(wrapper.emitted('update:draft')).toEqual([['changed draft'], ['recovered draft']]);
  });
});

/* eslint-enable vue/one-component-per-file, @typescript-eslint/consistent-type-assertions -- Restore file defaults after local fixture assertions. */
