<script
  setup
  lang="ts"
  generic="
    T extends { headline: string; key: PropertyKey; supportingText?: string }
  "
>
import { computed } from 'vue';
import MDListContainer from './MDListContainer.vue';
import MDListItem from './MDListItem.vue';

const { list, isItemButton } = defineProps<{
  list: T[];
  type?: 'list' | 'grid';
  isItemButton?: boolean;
}>();

const emit = defineEmits<{
  clickItem: [item: T, index: number];
}>();

const slots = defineSlots<{
  leadingAvatarContainer: (p: { item: T; index: number }) => unknown;
  leadingIcon: (p: { item: T; index: number }) => unknown;
  trailingIcon: (p: { item: T; index: number }) => unknown;
}>();

const listProp = computed(() => list);

const onClickItem = (item: T, index: number) => {
  emit('clickItem', item, index);
};

const itemTag = computed((): 'button' | 'li' | 'a' | 'div' =>
  isItemButton ? 'button' : 'li',
);

const containerTag = computed((): 'ul' | 'div' =>
  itemTag.value === 'li' ? 'ul' : 'div',
);
</script>

<template>
  <MDListContainer :type="type" :tag="containerTag" class="md-list">
    <TransitionGroup name="md-list">
      <MDListItem
        v-for="(item, index) in listProp"
        :key="item.key"
        :headline="item.headline"
        :supporting-text="item.supportingText"
        :is="itemTag"
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
