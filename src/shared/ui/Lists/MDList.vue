<script
  setup
  lang="ts"
  generic="
    T extends { headline: string; key: PropertyKey; supportingText?: string }
  "
>
import {
  computed,
  nextTick,
  shallowRef,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue';
import MDListContainer from './MDListContainer.vue';
import MDListItem from './MDListItem.vue';
import { deepReplaceJSONObject } from '@shared/lib/changeObject';
import { unrefElement, useVibrate } from '@vueuse/core';
import parseDuration from 'parse-duration';
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

const stateList = shallowRef<T[]>([]);

const watchHandleStateList = watch(
  stateList,
  (list) => {
    if (sortable) {
      emit('update:list', list);
    }
  },
  { deep: true },
);

watch(
  () => list,
  (list) => {
    watchHandleStateList.pause();
    deepReplaceJSONObject(stateList.value, list);
    void nextTick(() => {
      watchHandleStateList.resume();
    });
  },
  { immediate: true, deep: true },
);

const containerRef = useTemplateRef('containerRef');

const computedStyle = computed(() => {
  const el = unrefElement(containerRef);

  return el ? window.getComputedStyle(el) : undefined;
});

const animationDuration = computed(
  () =>
    parseDuration(
      computedStyle.value?.getPropertyValue('--md-sys-motion-duration-short4'),
    ) ?? 200,
);

const delayDuration = computed(
  () =>
    parseDuration(
      computedStyle.value?.getPropertyValue('--md-sys-motion-duration-long2'),
    ) ?? 1e3,
);

const { vibrate } = useVibrate();

// TODO: useSortable от vueuse перестаёт работать при изменении элементов в контейнере
// TODO: useSortable от vueuse запускается при монтировании, а не при появлении целевого

const {} = useSortable(containerRef, stateList);

const onClickItem = (item: T, index: number) => {
  emit('clickItem', item, index);
};

const itemTag = computed((): 'button' | 'li' =>
  sortable || isItemButton ? 'button' : 'li',
);

const containerTag = computed((): 'ul' | 'div' =>
  itemTag.value === 'li' ? 'ul' : 'div',
);
</script>

<template>
  <MDListContainer
    ref="containerRef"
    :type="type"
    :tag="containerTag"
    class="md-list"
  >
    <MDListItem
      v-for="(item, index) in list"
      :key="item.key"
      :headline="item.headline"
      :supporting-text="item.supportingText"
      :tag="itemTag"
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
  </MDListContainer>
</template>

<style lang="css" scoped>
.md-list {
  user-select: none;
}
</style>

<style lang="css">
.dragClass {
  border: 1px solid red !important;
}
.swapClass {
  border: 1px solid blue !important;
}
.ghostClass {
  border: 1px solid yellow !important;
}
.chosenClass {
  border: 1px solid green !important;
}
.fallbackClass {
  border: 1px solid chocolate !important;
}
.selectedClass {
  border: 1px solid aqua !important;
}
</style>
