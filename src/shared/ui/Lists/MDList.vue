<script
  setup
  lang="ts"
  generic="T extends { labelText: string; key: PropertyKey; supportingText?: string }"
>
import { computed } from 'vue';
import MDListContainer from './MDListContainer.vue';
import MDListItem from './MDListItem.vue';

const { list, itemMode = 'static' } = defineProps<{
  list: T[];
  type?: 'list' | 'grid' | undefined;
  itemMode?: 'static' | 'single-action' | undefined;
}>();

const emit = defineEmits<{
  actionItem: [payload: { item: T; index: number }];
}>();

const slots = defineSlots<{
  leading: (p: { item: T; index: number }) => unknown;
  trailing: (p: { item: T; index: number }) => unknown;
}>();

const listProp = computed(() => list);
const itemContainerTag = computed(() => (itemMode === 'static' ? 'li' : 'div'));
const containerTag = computed(() => (itemContainerTag.value === 'li' ? 'ul' : 'div'));

const onActionItem = (item: T, index: number) => {
  emit('actionItem', { item, index });
};
</script>

<template>
  <MDListContainer :is="containerTag" :type="type" class="md-list">
    <TransitionGroup name="md-list">
      <MDListItem
        v-for="(item, index) in listProp"
        :key="item.key"
        :mode="itemMode"
        :container-tag="itemContainerTag"
        :label-text="item.labelText"
        :supporting-text="item.supportingText"
        @action="() => onActionItem(item, index)"
      >
        <template v-if="!!slots.leading" #leading>
          <slot name="leading" :item="item" :index="index" />
        </template>

        <template v-if="!!slots.trailing" #trailing>
          <slot name="trailing" :item="item" :index="index" />
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
