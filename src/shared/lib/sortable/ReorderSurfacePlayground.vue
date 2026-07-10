<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { PlaygroundStory } from '../playground';
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

const containerEl = useTemplateRef('containerEl');
const itemMap = computed(() => new Map(list.value.map((item) => [String(item.id), item])));

const { draggedId, displayItemIdList } = useReorderSurface(containerEl, {
  itemIdList: computed(() => list.value.map((item) => String(item.id))),
  onCommit: ({ orderedIds }) => {
    list.value = orderedIds
      .map((id) => itemMap.value.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  },
});

const onItemContextMenu = (event: MouseEvent) => {
  event.preventDefault();
};
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <pre>{{ list }}</pre>
    </template>

    <template #space>
      <div ref="containerEl" class="container">
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
          @contextmenu="onItemContextMenu"
        >
          {{ itemMap.get(itemId)?.label }}
        </div>
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
