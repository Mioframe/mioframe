<script setup lang="ts">
import { computed, ref } from 'vue';
import { useReorder, type ReorderDragStartEvent } from '@shared/lib/reorder';

/**
 * `parent` and `child` are two independent registered items of the same `useReorder` instance:
 * `child` happens to be nested inside `parent`'s own DOM subtree, but each has its own identity
 * in the single ordered `keys` list. This is the shape that exposed the activator-ownership bug:
 * `child`'s own activator must belong to `child` alone and must never switch the enclosing,
 * activator-less `parent` into strict handle-only mode.
 */
const keys = ref<string[]>(['parent', 'child']);
const orderedKeys = computed(() => keys.value);

const dragStartCount = ref(0);
const lastDragStartKey = ref('');
const parentContentClickCount = ref(0);
const parentButtonClickCount = ref(0);
const childHandleClickCount = ref(0);

const { draggingKey, vReorderContainer, vReorderItem, vReorderActivator } = useReorder({
  keys: orderedKeys,
  onReorder: ({ fromIndex, toIndex }) => {
    const next = [...keys.value];
    const [moved] = next.splice(fromIndex, 1);
    if (moved) next.splice(toIndex, 0, moved);
    keys.value = next;
  },
  onDragStart: ({ key }: ReorderDragStartEvent<string>) => {
    dragStartCount.value += 1;
    lastDragStartKey.value = key;
  },
});

const onParentContentClick = () => {
  parentContentClickCount.value += 1;
};

const onParentButtonClick = () => {
  parentButtonClickCount.value += 1;
};

const onChildHandleClick = () => {
  childHandleClickCount.value += 1;
};
</script>

<template>
  <div class="reorder-nested-items-story-harness">
    <dl class="reorder-nested-items-story-harness__meta">
      <div>
        <dt>Current order</dt>
        <dd>
          <output aria-label="Current order">{{ orderedKeys.join(',') }}</output>
        </dd>
      </div>

      <div>
        <dt>Dragging key</dt>
        <dd>
          <output aria-label="Dragging key">{{ draggingKey ?? '' }}</output>
        </dd>
      </div>

      <div>
        <dt>Drag start count</dt>
        <dd>
          <output aria-label="Drag start count">{{ dragStartCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Last drag start key</dt>
        <dd>
          <output aria-label="Last drag start key">{{ lastDragStartKey }}</output>
        </dd>
      </div>

      <div>
        <dt>Parent content click count</dt>
        <dd>
          <output aria-label="Parent content click count">{{ parentContentClickCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Parent button click count</dt>
        <dd>
          <output aria-label="Parent button click count">{{ parentButtonClickCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Child handle click count</dt>
        <dd>
          <output aria-label="Child handle click count">{{ childHandleClickCount }}</output>
        </dd>
      </div>
    </dl>

    <div
      v-reorder-container
      role="list"
      aria-label="Nested reorder items"
      class="reorder-nested-items-story-harness__container"
    >
      <!--
        `parent` owns no activator of its own, so it keeps the default (non-interactive-content-
        activates, native-controls-blocked) behavior regardless of `child`'s activator nested
        inside it.
      -->
      <div
        v-reorder-item="'parent'"
        role="listitem"
        aria-label="parent"
        class="reorder-nested-items-story-harness__parent"
      >
        <span
          role="button"
          tabindex="0"
          aria-label="parent content"
          class="reorder-nested-items-story-harness__parent-content"
          @click="onParentContentClick"
          @keydown.enter.prevent="onParentContentClick"
        >
          parent content
        </span>

        <button
          type="button"
          aria-label="parent button"
          class="reorder-nested-items-story-harness__parent-button"
          @click="onParentButtonClick"
        >
          parent button
        </button>

        <!--
          `child` registers as a second, independent item nested inside `parent`'s DOM subtree.
          Its own activator must belong to `child` alone.
        -->
        <div
          v-reorder-item="'child'"
          role="listitem"
          aria-label="child"
          class="reorder-nested-items-story-harness__child"
        >
          <button
            v-reorder-activator
            type="button"
            aria-label="child handle"
            class="reorder-nested-items-story-harness__child-handle"
            @click="onChildHandleClick"
          >
            child handle
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * Story-local presentation only: this harness demonstrates the reorder library's public nested-
 * item activator-ownership contract and owns no part of the library's (nonexistent) production
 * visual treatment.
 */
.reorder-nested-items-story-harness {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: sans-serif;
  font-size: 13px;
}

.reorder-nested-items-story-harness__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px 16px;
  margin: 0;
}

.reorder-nested-items-story-harness__meta > div {
  min-width: 0;
}

.reorder-nested-items-story-harness__meta dt {
  font-weight: 600;
}

.reorder-nested-items-story-harness__meta dd {
  margin: 2px 0 0;
  font-family: monospace;
  word-break: break-all;
}

.reorder-nested-items-story-harness__container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 320px;
  padding: 8px;
  border: 1px dashed #999;
}

.reorder-nested-items-story-harness__parent {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  cursor: grab;
  background: #eef2ff;
  border: 1px solid #a5b4fc;
  border-radius: 4px;
}

.reorder-nested-items-story-harness__parent-content {
  flex: 1;
  cursor: inherit;
}

.reorder-nested-items-story-harness__parent-button {
  cursor: pointer;
}

.reorder-nested-items-story-harness__child {
  cursor: default;
}

.reorder-nested-items-story-harness__child-handle {
  cursor: grab;
}
</style>
