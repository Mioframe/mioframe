<script setup lang="ts">
import { reactive, ref, useTemplateRef } from 'vue';
import { useSortable } from './useSortable';

const list = ref(
  new Array(40)
    .fill(0)
    .map((_, index) => ({ id: index, label: `item_${index}` })),
);

const state = reactive({
  isGrid: false,
});

const containerEl = useTemplateRef('containerEl');

const { draggableItem } = useSortable(containerEl, list);
</script>

<template>
  <Story title="use function/useSortable">
    <template #controls>
      <HstCheckbox v-model="state.isGrid" title="grid" />
    </template>

    <div
      ref="containerEl"
      class="container"
      :class="{
        _grid: state.isGrid,
      }"
    >
      <TransitionGroup name="transition">
        <div
          v-for="item in list"
          :key="item.id"
          type="button"
          class="item"
          draggable="true"
          :class="{
            _draggable: draggableItem === item,
          }"
        >
          {{ item.label }}
        </div>
      </TransitionGroup>
    </div>

    <pre>{{ list }}</pre>
  </Story>
</template>

<style lang="css" scoped>
.container {
  gap: 16px;
  padding: 16px;
  flex-direction: column;
  display: flex;

  &._grid {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .item {
    display: inline-block;
    padding: 6px;
    border: 1px solid blue;
    background: lightblue;
    cursor: grab;

    &::before {
      content: 'default';
      display: block;
      pointer-events: none;
    }

    &._draggable {
      background-color: yellowgreen;
      &::before {
        content: 'drag';
      }
    }
  }

  .transition {
    &-move,
    &-enter-active,
    &-leave-active {
      transition: all 0.2s linear;
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
}
</style>
