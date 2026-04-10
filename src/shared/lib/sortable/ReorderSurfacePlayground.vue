<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef } from 'vue';
import { PlaygroundBoolean, PlaygroundStory } from '../playground';
import { randomInt } from 'es-toolkit';
import { vReorderItem } from './reorderDirectives';
import { useReorderSurface } from './useReorderSurface';

const randomColor = (): string => `rgb(${randomInt(255)} ${randomInt(255)} ${randomInt(255)})`;

const list = ref(
  new Array(40).fill(0).map((_, index) => ({
    id: index,
    label: `item_${index}`,
    color: randomColor(),
  })),
);

const state = reactive({
  isGrid: false,
});

const containerEl = useTemplateRef('containerEl');
const itemMap = computed(() => new Map(list.value.map((item) => [String(item.id), item])));

const { draggedId, displayItemIdList } = useReorderSurface(containerEl, {
  itemIdList: computed(() => list.value.map((item) => String(item.id))),
  layout: () => (state.isGrid ? 'grid' : 'vertical'),
  onCommit: ({ orderedIds }) => {
    list.value = orderedIds
      .map((id) => itemMap.value.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  },
});
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <PlaygroundBoolean v-model:model-value="state.isGrid" label="grid" />

      <pre>{{ list }}</pre>
    </template>

    <template #space>
      <div
        ref="containerEl"
        class="container"
        :class="{
          _grid: state.isGrid,
        }"
      >
        <TransitionGroup name="dnd">
          <div
            v-for="itemId in displayItemIdList"
            :key="itemId"
            v-reorder-item="itemId"
            class="item"
            :class="{
              _draggable: draggedId === itemId,
            }"
            :style="{
              background: itemMap.get(itemId)?.color,
            }"
            @contextmenu.prevent="() => undefined"
          >
            {{ itemMap.get(itemId)?.label }}
          </div>
        </TransitionGroup>
      </div>
    </template>
  </PlaygroundStory>
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
    color: white;
    text-shadow:
      -1px 0 black,
      0 1px black,
      1px 0 black,
      0 -1px black;

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
}
</style>
