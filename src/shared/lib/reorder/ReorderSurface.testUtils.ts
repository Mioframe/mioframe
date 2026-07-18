import { defineComponent, h, useTemplateRef } from 'vue';
import { useReorderItem } from './useReorderItem';

/** Minimal sortable row test double registered with the nearest `ReorderSurface`. */
export const ReorderTestItem = defineComponent({
  props: {
    id: { type: String, required: true },
    index: { type: Number, required: true },
  },
  setup(props) {
    const elRef = useTemplateRef<HTMLLIElement>('el');

    useReorderItem({
      id: () => props.id,
      index: () => props.index,
      element: () => elRef.value ?? undefined,
      handle: () => elRef.value ?? undefined,
    });

    return () => h('li', { ref: 'el' }, props.id);
  },
});
