<script
  setup
  lang="ts"
  generic="
    T extends { headline: string; key: PropertyKey; supportingText?: string }
  "
>
import type { Ref } from 'vue';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import MDListContainer from './MDListContainer.vue';
import MDListItem from './MDListItem.vue';
import { useSortable } from '@shared/lib/sortable';

const { list, sortable, isItemButton } = defineProps<{
  list: T[];
  type?: 'list' | 'grid';
  sortable?: boolean;
  isItemButton?: boolean;
}>();

const emit = defineEmits<{
  'update:list': [T[]];
  clickItem: [item: T, index: number];
}>();

const slots = defineSlots<{
  leadingAvatarContainer: (p: { item: T; index: number }) => unknown;
  leadingIcon: (p: { item: T; index: number }) => unknown;
  trailingIcon: (p: { item: T; index: number }) => unknown;
}>();

const listProp = computed(() => list);

const listState: Ref<T[]> = ref([]);

const watchHandleListState = watch(
  listState,
  (list) => {
    if (sortable) {
      watchHandleListProp.pause();
      emit('update:list', list);
      void nextTick(() => {
        watchHandleListProp.resume();
      });
    }
  },
  { deep: true },
);

const watchHandleListProp = watch(
  listProp,
  (list) => {
    watchHandleListState.pause();
    // listState.value = list;
    void nextTick(() => {
      watchHandleListState.resume();
    });
  },
  { immediate: true, deep: true },
);

const containerRef = useTemplateRef('containerRef');

const { draggableItem } = useSortable(
  computed(() => (sortable ? containerRef.value : undefined)),
  listProp,
);

const onClickItem = (item: T, index: number) => {
  emit('clickItem', item, index);
};

const itemTag = computed((): 'button' | 'li' | 'a' | 'div' =>
  sortable ? 'a' : isItemButton ? 'button' : 'li',
);

const containerTag = computed((): 'ul' | 'div' =>
  itemTag.value === 'li' ? 'ul' : 'div',
);

// TODO: нужно ли делать listState или сортировка будет манипулировать listProp?
</script>

<template>
  <MDListContainer
    ref="containerRef"
    :type="type"
    :tag="containerTag"
    class="md-list"
  >
    <TransitionGroup name="md-list">
      <MDListItem
        v-for="(item, index) in listProp"
        :key="item.key"
        :headline="item.headline"
        :supporting-text="item.supportingText"
        :tag="itemTag"
        :class="{
          'md-state_drag': item === draggableItem,
        }"
        :draggable="sortable"
        @click="onClickItem(item, index)"
      >
        <template v-if="!!slots.leadingAvatarContainer" #leadingAvatarContainer>
          <slot name="leadingAvatarContainer" :item :index />
        </template>

        <template v-if="!!slots.leadingIcon" #leadingIcon>
          <slot name="leadingIcon" :item :index />
        </template>

        <template v-if="!!slots.trailingIcon" #trailingIcon>
          <slot name="trailingIcon" :item :index />
        </template>
      </MDListItem>
    </TransitionGroup>
  </MDListContainer>
</template>

<style lang="css" scoped>
.md-list {
  user-select: none;

  &-move,
  &-enter-active,
  &-leave-active {
    transition: all 0.2s linear;
    pointer-events: none;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
  }

  &-leave-active {
    position: absolute;
    pointer-events: none;
  }
}
</style>
