/* eslint-disable vue/one-component-per-file, @typescript-eslint/consistent-type-assertions -- Focused child stubs and branded fixture identities stay local to this contract test. */
import { mount } from '@vue/test-utils';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseItemId, DatabasePropertyId } from '@shared/lib/databaseDocument';
import { ref, defineComponent, h } from 'vue';
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
  MDStateLayer: defineComponent({ render: () => h('div') }),
  useRipple: vi.fn(),
  useStateLayer: () => ({
    hover: ref(false),
    focused: ref(false),
    durationPressedState: ref(false),
  }),
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

  it('hides editable and cancel/draft interaction while resolving, then restores the exact draft', async () => {
    const wrapper = mountEditor(false);
    expect(wrapper.find('input').exists()).toBe(true);
    await wrapper.find('input').setValue('changed draft');
    expect(wrapper.emitted('update:draft')).toEqual([['changed draft']]);

    await wrapper.setProps({ editSession: { draft: 'recoverable draft', resolving: true } });
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.attributes('tabindex')).toBeUndefined();
    await wrapper.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('cancelEdit')).toBeUndefined();

    await wrapper.setProps({ editSession: { draft: 'recoverable draft', resolving: false } });
    expect(wrapper.find('input').element).toHaveProperty('value', 'recoverable draft');
  });
});

/* eslint-enable vue/one-component-per-file, @typescript-eslint/consistent-type-assertions */
